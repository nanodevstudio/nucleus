import { chain } from "@/async";
import {
  DataNode,
  Datom,
  DBHead,
  IndexComparator,
  IndexNode,
  KVBackend,
  NodeType,
  Pointer,
} from "@/types";
import {
  BPlusIndexNodeData,
  BPlusDataNodeData,
  Datom as DatomData,
} from "generated/protocolBuffers";

const toDatom = (value: DatomData) => {
  return new Datom(value.e, value.a, value.v, value.t);
};

export class BPlusDataNode implements DataNode {
  type = NodeType.data as NodeType.data;
  private datoms: Datom[] = [];

  constructor(data: BPlusDataNodeData) {
    this.datoms = data.data.map((value) => toDatom(value));
  }

  getData() {
    return this.datoms;
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

    return chain(backend.get(pointer), (value: Buffer) => {
      const data = BPlusIndexNodeData.decode(value);
      return new BPlusIndexNode(backend, indexer, data);
    });
  }

  getPointers(): Pointer[] {
    return this.data.pointers.map((value) => {
      return { pointer: value.pointer, max: toDatom(value.max) };
    });
  }
}
