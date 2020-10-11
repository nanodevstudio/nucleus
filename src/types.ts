export enum NodeType {
  data = 1,
  index = 2,
}

export class Datom {
  constructor(
    public e: BigInteger,
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
  getData: (start?: Datom, end?: Datom) => MaybePromise<Datom[]>;
}

export interface IndexNode {
  type: NodeType.index;
  findNextNode: (key: Datom) => number;
  findFirstNode: () => number;
  findLastNode: () => number;
  getNode: (index: number) => MaybePromise<GeneralNode | null>;
  write: (datoms: Datom[]) => Promise<IndexNode>;
}

export type GeneralNode = DataNode | IndexNode;

export enum DataIndex {
  EAVT = 1,
  AEVT = 2,
  AVET = 3,
  VAET = 4,
}

export interface DB {
  getIndex: (index: DataIndex) => IndexNode;
}

export interface KVEntry {
  key: Buffer;
  value: Buffer;
}

export interface KVBackend {
  put(entries: KVEntry[]): MaybePromise<void>;
  get(key: Buffer): MaybePromise<Buffer>;
  getAll(keys: Buffer[]): MaybePromise<Buffer>;
}

export interface DBHead {
  backend: KVBackend;
  getIndexKey: (key: DataIndex) => MaybePromise<Buffer>;
  setIndexKey: (key: DataIndex, value: Buffer) => MaybePromise<DBHead>;
}
