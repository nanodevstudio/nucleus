export enum NodeType {
  data = 1,
  index = 2,
}

export class Datom {
  constructor(
    public e: bigint,
    public a: number,
    public v: any,
    public t: number
  ) {}
}

export class IndexRange {
  constructor(public upper: Datom, public lower: Datom) {}
}

export type MaybePromise<T> = T | Promise<T>;

export interface DataNode {
  type: NodeType.data;
  getData: (start?: Datom, end?: Datom) => Datom[];
}

export interface Pointer {
  max: Datom;
  pointer: Buffer;
}

export interface IndexNode {
  type: NodeType.index;
  findNextNode: (key: Datom) => number | null;
  findFirstNode: () => number;
  findLastNode: () => number;
  getIndexDatom: (index: number) => Datom;
  getNode: (index: number) => MaybePromise<GeneralNode | null>;
  getPointers: () => Pointer[];
}

export type GeneralNode = DataNode | IndexNode;

export enum DataIndex {
  EAVT = 0,
  AEVT = 1,
  AVET = 2,
  VAET = 3,
}

export interface Snapshot {
  writeDatoms: (datoms: Datom[]) => MaybePromise<Snapshot>;
  getIndex: (index: DataIndex) => MaybePromise<DataNode | IndexNode | null>;
}

export interface KVEntry {
  key: Buffer;
  value: Buffer;
}

export interface KVBackend {
  put(entries: KVEntry[]): MaybePromise<void>;
  get(key: Buffer): MaybePromise<Buffer>;
  getAll(keys: Buffer[]): MaybePromise<Buffer>;
  getPointer(): MaybePromise<Buffer>;
}

export interface DBHead {
  backend: KVBackend;
  getIndexKey: (key: DataIndex) => MaybePromise<Buffer>;
  setIndexKey: (key: DataIndex, value: Buffer) => MaybePromise<DBHead>;
}

export interface IndexComparator {
  compare: (a: Datom, b: Datom) => 0 | -1 | 1;
  index: DataIndex;
}

export interface Indexer {
  writeDatoms(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Buffer | null,
    sortedDatoms: Datom[]
  ): MaybePromise<Buffer>;

  getNode(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Buffer
  ): MaybePromise<IndexNode | DataNode>;
}
