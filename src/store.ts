import { Datom, DB } from "./types";

export const writeDatoms = (db: DB, values: Datom[]) => {
  return db.writeDatoms(values);
};
