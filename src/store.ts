import { Datom, Snapshot } from "./types";

export const writeDatoms = (db: Snapshot, values: Datom[]) => {
  return db.writeDatoms(values);
};
