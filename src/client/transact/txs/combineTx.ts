import { Snapshot } from "@/types";
import { Tx } from "../tx-types";

export class Combine implements Tx {
  constructor(public txs: Tx[]) {}

  async getDatoms(snapshot: Snapshot) {
    return (
      await Promise.all(this.txs.map((tx) => tx.getDatoms(snapshot)))
    ).flat();
  }
}

export const combineTxs = (txs: Tx[]) => {
  return new Combine(txs);
};
