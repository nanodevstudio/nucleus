import { chain } from "@/async";
import {
  BPlusDataNodeData,
  BPlusIndexNodeData,
  Datom as DatomData,
} from "@/generated/protocolBuffers";
import {
  DataNode,
  Datom,
  IndexComparator,
  IndexNode,
  KVBackend,
  NodeType,
  Pointer,
} from "@/types";

export const toBigInt = (value: Long) => {
  return BigInt(value.toString());
};

const toDatom = (value: DatomData) => {
  return new Datom(
    toBigInt(value.e),
    toBigInt(value.a),
    (value as any)[value.v as any],
    toBigInt(value.t)
  );
};

export class BPlusDataNode implements DataNode {
  type = NodeType.data as NodeType.data;
  private datoms: Datom[] = [];

  constructor(private comparator: IndexComparator, data: BPlusDataNodeData) {
    this.datoms = data.data.map((value) => toDatom(value));
  }

  getData(start?: Datom, end?: Datom) {
    const { datoms, comparator } = this;

    if (start == null && end == null) {
      return datoms;
    }

    let result = datoms;

    if (start != null) {
      const pivot = result.findIndex(
        (datom) => comparator.compare(datom, start) >= 0
      );

      result = pivot === -1 ? [] : result.slice(pivot);
    }

    if (end != null) {
      const pivot = result.findIndex(
        (datom) => comparator.compare(datom, end) === 1
      );

      result = pivot === -1 ? result : result.slice(0, pivot);
    }

    return result;
  }
}

export class BPlusIndexNode implements IndexNode {
  type = NodeType.index as NodeType.index;

  constructor(
    private backend: KVBackend,
    private indexer: IndexComparator,
    private data: BPlusIndexNodeData
  ) {}

  findFirstNode() {
    return 0;
  }

  findLastNode() {
    return this.data.pointers[this.data.pointers.length - 1];
  }

  findNextNode(datom: Datom) {
    const { data, indexer } = this;

    const result = data.pointers.findIndex((value) => {
      const compare = indexer.compare(datom, toDatom(value));

      return compare === 1;
    });

    if (result === -1) {
      return null;
    }

    return result;
  }

  getIndexDatom(index: number) {
    return toDatom(this.data.pointers[index].max);
  }

  getNode(index: number) {
    const { backend, data, indexer } = this;
    const { pointer } = data.pointers[index];

    return chain(backend.get(pointer), (value: Uint8Array | null) => {
      const data = BPlusIndexNodeData.decode(value!);
      return new BPlusIndexNode(backend, indexer, data);
    });
  }

  getPointers(): Pointer[] {
    return this.data.pointers.map((value) => {
      return { pointer: value.pointer, max: toDatom(value.max) };
    });
  }
}
