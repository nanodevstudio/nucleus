import { Datom, IndexNode } from "./types";

export const writeDatoms = (index: IndexNode, values: Datom[]) => {
  return index.write(values);
};
