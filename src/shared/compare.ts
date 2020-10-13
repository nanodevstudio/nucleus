import { DataIndex, Datom, Indexer } from "@/types";

const typeOrder = ["bigint", "number", "string", "boolean", "object"];
type CompareNumber = 0 | -1 | 1;

const compare = (a: any, b: any): CompareNumber => {
  if (typeof a !== typeof b) {
    return compare(typeOrder.indexOf(a), typeOrder.indexOf(b));
  }

  if (a === b) {
    return 0;
  }

  if (typeof a === "string") {
    return a.localeCompare(b) as CompareNumber;
  }

  if (typeof a === "object") {
    throw new Error("cannot compare bytes");
  }

  return a > b ? 1 : -1;
};

class DataIndexer {
  constructor(
    public index: DataIndex,
    private sortOrder: ("e" | "v" | "a" | "t")[]
  ) {}

  compare(a: Datom, b: Datom): -1 | 0 | 1 {
    const { sortOrder } = this;

    for (const attr of sortOrder) {
      const comparison = compare(a[attr], b[attr]);

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  }
}

const indexers: Indexer[] = [];

indexers[DataIndex.EAVT] = new DataIndexer(DataIndex.EAVT, [
  "e",
  "a",
  "v",
  "t",
]);

indexers[DataIndex.VAET] = new DataIndexer(DataIndex.EAVT, [
  "v",
  "a",
  "e",
  "t",
]);

indexers[DataIndex.EAVT] = new DataIndexer(DataIndex.EAVT, [
  "e",
  "a",
  "v",
  "t",
]);

indexers[DataIndex.VAET] = new DataIndexer(DataIndex.EAVT, [
  "v",
  "a",
  "e",
  "t",
]);

export { indexers };
