import { getAttributeId, getT, resolveId } from "@/client/transact/common";
import { Snapshot, Datom } from "@/types";
import { Tx, TxEntityId } from "../tx-types";

export class InsertDatom implements Tx {
  constructor(
    public id: TxEntityId,
    public attribute: string,
    public value: any
  ) {}

  async getDatoms(snapshot: Snapshot) {
    return [
      new Datom(
        resolveId(snapshot, this.id),
        await getAttributeId(snapshot, this.attribute),
        this.value,
        getT(snapshot)
      ),
    ];
  }
}
