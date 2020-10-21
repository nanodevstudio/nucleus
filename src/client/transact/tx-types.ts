import { Datom, MaybePromise, Snapshot } from "@/types";

export interface Tx {
  getDatoms(snapshot: Snapshot): MaybePromise<Datom[]>;
}

export type TxEntityId = bigint | string | symbol;

export type TxContext = {};
