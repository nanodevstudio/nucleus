export enum NodeType {
  data = 1,
  index = 2,
}

export class Datom {
  constructor(
    public e?: UINT64,
    public a?: UINT64 | string,
    public v?: any,
    public t?: UINT64
  ) {}
}

export class IndexRange {
  constructor(public lower?: Datom, public upper?: Datom) {}
}

export type MaybePromise<T> = T | Promise<T>;

export interface DataNode {
  type: NodeType.data;
  getData: (start?: Datom, end?: Datom) => Datom[];
}

export interface Pointer {
  max: Datom;
  pointer: Uint8Array;
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

export type UINT64 = bigint | number;

export interface Clone<T> {
  clone(): T;
}

export interface Snapshot extends Clone<Snapshot> {
  indexer: Indexer;
  getIndex: (index: DataIndex) => MaybePromise<DataNode | IndexNode | null>;
}

export interface DB {
  indexer: Indexer;
  backend: KVBackend;
}

export interface KVEntry {
  key: Uint8Array;
  value: Uint8Array;
}

export interface KVBackend {
  put(entries: KVEntry[]): MaybePromise<void>;
  get(key: Uint8Array): MaybePromise<Uint8Array | null>;
  getAll(keys: Uint8Array[]): MaybePromise<(Uint8Array | null)[]>;
  getPointer(): MaybePromise<Uint8Array>;
}

export interface IndexComparator {
  compare: (a: Datom, b: Datom) => 0 | -1 | 1;
  index: DataIndex;
}

export interface Indexer {
  entityId(): UINT64;

  writeDatoms(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Uint8Array | null,
    sortedDatoms: Datom[]
  ): MaybePromise<Uint8Array>;

  getNode(
    backend: KVBackend,
    comparator: IndexComparator,
    pointer: Uint8Array
  ): MaybePromise<IndexNode | DataNode>;
}
