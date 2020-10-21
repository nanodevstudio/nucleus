import { DataIndex, Datom, IndexComparator } from "@/types";

const typeOrder = ["number", "bigint", "string", "boolean", "object"];
type CompareNumber = 0 | -1 | 1;

const compare = (a: any, b: any): CompareNumber => {
  if (a === b) {
    return 0;
  }

  if (a === Infinity) {
    return 1;
  }

  if (b === Infinity) {
    return -1;
  }

  if (a === -Infinity) {
    return -1;
  }

  if (b === -Infinity) {
    return 1;
  }

  if (typeof a !== typeof b) {
    return compare(typeOrder.indexOf(a), typeOrder.indexOf(b));
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

const comparators: IndexComparator[] = [];

comparators[DataIndex.EAVT] = new DataIndexer(DataIndex.EAVT, [
  "e",
  "a",
  "v",
  "t",
]);

comparators[DataIndex.AVET] = new DataIndexer(DataIndex.AVET, [
  "a",
  "v",
  "e",
  "t",
]);

comparators[DataIndex.AEVT] = new DataIndexer(DataIndex.AEVT, [
  "a",
  "e",
  "v",
  "t",
]);

comparators[DataIndex.VAET] = new DataIndexer(DataIndex.VAET, [
  "v",
  "a",
  "e",
  "t",
]);

export { comparators };
