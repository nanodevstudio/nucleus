import {
  Datom,
  IndexComparator,
  Indexer,
  KVBackend,
  NodeType,
  Pointer,
  UINT64,
} from "@/types";
import { BPlusDataNode, BPlusIndexNode, toBigInt } from "./BPlusNode";
import { BPlusNode, Datom as DatomData } from "@/generated/protocolBuffers";
import { chain } from "@/async";
import * as crypto from "crypto";
import Long from "long";

class BPlusIndexContext {
  constructor(
    public backend: KVBackend,
    public comparator: IndexComparator,
    public branchingFactor: number
  ) {}
}

const combineSorted = <T>(
  indexer: IndexComparator,
  getDatom: (value: T) => Datom,
  a: T[],
  b: T[]
) => {
  let bIndex = 0;
  let aIndex = 0;
  let combined: T[] = [];

  while (true) {
    const aEnded = aIndex === a.length;
    const bEnded = bIndex === b.length;

    if (aEnded && bEnded) {
      return combined;
    }

    if (aEnded) {
      combined.push(...b.slice(bIndex));

      return combined;
    }

    if (bEnded) {
      combined.push(...a.slice(aIndex));
      return combined;
    }

    const aDatom = getDatom(a[aIndex]);
    const bDatom = getDatom(b[bIndex]);
    const compared = indexer.compare(aDatom, bDatom);

    if (compared === 1) {
      combined.push(b[bIndex]);
      bIndex += 1;
    } else if (compared === -1) {
      combined.push(a[aIndex]);
      aIndex += 1;
    } else {
      combined.push(b[bIndex]);
      aIndex += 1;
      bIndex += 1;
    }
  }
};

const makeNodeFromPointers = async (
  ctx: BPlusIndexContext,
  nodeData: Pointer[]
): Promise<Pointer> => {
  const { branchingFactor, backend } = ctx;

  if (nodeData.length > branchingFactor) {
    return makeNodeFromPointers(
      ctx,
      await makeNodesFromPointers(ctx, nodeData)
    );
  }

  if (nodeData.length === 0) {
    throw new Error("cannot create BPlusNode with no pointers");
  }

  if (nodeData.length === 1) {
    return nodeData[0];
  }

  const encoded = BPlusNode.encode({ index: { pointers: nodeData } }).finish();
  const pointer = await backend.getPointer();

  await backend.put([
    {
      key: pointer,
      value: encoded,
    },
  ]);

  return {
    max: nodeData[nodeData.length - 1].max,
    pointer: pointer,
  };
};

const makeNodesFromPointers = async (
  ctx: BPlusIndexContext,
  nodeData: Pointer[]
): Promise<Pointer[]> => {
  const { branchingFactor: branchingFator } = ctx;
  if (nodeData.length > branchingFator) {
    const partitionCount = Math.ceil(nodeData.length / branchingFator);
    const itemsPerPartition = Math.floor(nodeData.length / partitionCount);
    const pointers: Promise<Pointer>[] = [];

    for (let i = 0; i < partitionCount; i++) {
      const start = i * itemsPerPartition;
      const partition = nodeData.slice(start, start + itemsPerPartition);

      pointers.push(makeNodeFromPointers(ctx, partition));
    }

    if (pointers.length > branchingFator) {
      return makeNodesFromPointers(ctx, await Promise.all(pointers));
    }

    return Promise.all(pointers);
  }

  return [await makeNodeFromPointers(ctx, nodeData)];
};

const toLong = (int: UINT64) => {
  return Long.fromString(int.toString());
};

const encodeValue = (value: any): ["string", string] => {
  if (typeof value === "string") {
    return ["string", value];
  }

  throw new Error(`cannot encode datom value ${typeof value}`);
};

const toProtoDatom = (data: Datom) => {
  const [valueFieldName, encodedValue] = encodeValue(data.v);

  return DatomData.create({
    e: toLong(data.e!),
    a: toLong(data.a!),
    t: toLong(data.t!),
    [valueFieldName]: encodedValue,
  });
};

const makeDataNodePointer = async (
  { backend }: BPlusIndexContext,
  nodeData: Datom[]
): Promise<Pointer> => {
  if (nodeData.length === 0) {
    throw new Error("cannot create BPlusNode with no pointers");
  }

  const encoded = BPlusNode.encode({
    data: { data: nodeData.map((value) => toProtoDatom(value)) },
  }).finish();
  const pointer = await backend.getPointer();

  await backend.put([
    {
      key: pointer,
      value: encoded,
    },
  ]);

  return {
    max: nodeData[nodeData.length - 1],
    pointer: pointer,
  };
};

const makeNewIndexNodesFromData = async (
  ctx: BPlusIndexContext,
  nodeData: Datom[]
): Promise<Pointer[]> => {
  const { branchingFactor: branchingFator } = ctx;

  if (nodeData.length > branchingFator) {
    const partitionCount = Math.ceil(nodeData.length / branchingFator);
    const itemsPerPartition = Math.floor(nodeData.length / partitionCount);
    const pointers: Promise<Pointer>[] = [];

    for (let i = 0; i < partitionCount; i++) {
      const start = i * itemsPerPartition;
      const partition = nodeData.slice(start, start + itemsPerPartition);

      pointers.push(makeDataNodePointer(ctx, partition));
    }

    if (pointers.length > branchingFator) {
      return makeNodesFromPointers(ctx, await Promise.all(pointers));
    }

    return Promise.all(pointers);
  }

  return [await makeDataNodePointer(ctx, nodeData)];
};

const makeNewNodes = async (
  ctx: BPlusIndexContext,
  root: BPlusIndexNode,
  addNodes: Pointer[]
): Promise<Pointer[]> => {
  const nodeData = combineSorted(
    ctx.comparator,
    (pointer) => pointer.max,
    root.getPointers(),
    addNodes
  );

  return makeNodesFromPointers(ctx, nodeData);
};

const writeIndex = async (
  ctx: BPlusIndexContext,
  root: BPlusIndexNode | BPlusDataNode,
  sortedDatoms: Datom[]
): Promise<Pointer[]> => {
  if (root.type === NodeType.data) {
    const data = root.getData();
    const combined = combineSorted(
      ctx.comparator,
      (value) => value,
      data,
      sortedDatoms
    );

    return makeNewIndexNodesFromData(ctx, combined);
  }

  let datoms = sortedDatoms;
  const index = root.findNextNode(datoms[0]);

  if (index == null) {
    const node = await root.getNode(root.findLastNode());
    return makeNewNodes(ctx, root, await writeIndex(ctx, node, sortedDatoms));
  }

  const children = [];
  let currentMax = root.getIndexDatom(index);
  let currentStack: Datom[] = [];
  let currrentIndex: number | null = index;

  for (const datom of datoms) {
    if (ctx.comparator.compare(datom, currentMax) !== 1) {
      currentStack.push(datom);
    } else {
      children.push(
        chain(root.getNode(currrentIndex!), (node) =>
          writeIndex(ctx, node, currentStack)
        )
      );

      currrentIndex = root.findNextNode(datoms[0]);

      if (currrentIndex == null) {
        children.push(
          chain(root.findLastNode(), (node) =>
            writeIndex(ctx, node, currentStack)
          )
        );
        break;
      } else {
        currentMax = root.getIndexDatom(index);
        currentStack = [datom];
      }
    }
  }

  return Promise.all(children).then((value) =>
    makeNewNodes(ctx, root, value.flat())
  );
};

const abs = (value: bigint) => {
  if (value > 0n) {
    return value;
  }

  return -1n * value;
};

export class BPlusIndexer implements Indexer {
  constructor(private branchingFactor: number) {}

  entityId() {
    const bytes = crypto.randomBytes(8);
    const bigIntArr = new BigInt64Array(bytes.buffer);

    return abs(bigIntArr[0]);
  }

  async writeDatoms(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Uint8Array | null,
    sortedDatoms: Datom[]
  ) {
    const ctx = new BPlusIndexContext(
      backend,
      comparator,
      this.branchingFactor
    );

    if (pointer == null) {
      const pointer = makeNodeFromPointers(
        ctx,
        await makeNewIndexNodesFromData(ctx, sortedDatoms)
      );

      return (await pointer).pointer;
    }

    const node = await this.getNode(backend, comparator, pointer);
    const pointers = await writeIndex(
      ctx,
      node as BPlusIndexNode,
      sortedDatoms
    );
    const root = await makeNodeFromPointers(ctx, pointers);

    return root.pointer;
  }

  async getNode(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Uint8Array
  ) {
    const data = await backend.get(pointer);

    if (data == null) {
      throw new Error("could not find node");
    }

    const result = BPlusNode.decode(new Uint8Array(data));

    if (result.index) {
      return new BPlusIndexNode(backend, comparator, result.index);
    }

    return new BPlusDataNode(comparator, result.data);
  }
}

export const makeBPlusIndexer = (branchingFactor: number = 10) => {
  return new BPlusIndexer(branchingFactor);
};
