import { DBHeadData } from "@/generated/protocolBuffers";
import { comparators } from "@/shared/compare";
import { DataIndex, Datom, DB, Snapshot } from "@/types";
import Long from "long";
import { toPointer } from "../common/encoding";
import { DB_HEAD, getSnapshot } from "../query/snapshot";
import { Tx } from "./tx-types";

const writeIndex = async (
  db: DB,
  head: DBHeadData,
  index: DataIndex,
  datoms: Datom[]
) => {
  const comparator = comparators[index];
  const sortedDatoms = datoms.slice().sort((a, b) => comparator.compare(a, b));
  const indexName = DataIndex[index].toLowerCase();

  return await db.indexer.writeDatoms(
    db.backend,
    comparator,
    toPointer((head as any)[indexName]),
    sortedDatoms
  );
};

const toLong = (newIndexHead: Uint8Array) => {
  const head = new Uint32Array(
    newIndexHead.buffer,
    newIndexHead.byteOffset,
    newIndexHead.byteLength / 4
  );

  return new Long(head[0], head[1]);
};

export const transact = async (db: DB, transactions: Tx[]) => {
  const snapshot = await getSnapshot(db);
  const datomResults = (
    await Promise.all(transactions.map((tx) => tx.getDatoms(snapshot)))
  ).flat();

  // TODO check inter-tx conflicts

  const eavt = await writeIndex(
    db,
    snapshot.head,
    DataIndex.EAVT,
    datomResults
  );

  const avet = await writeIndex(
    db,
    snapshot.head,
    DataIndex.AVET,
    datomResults
  );

  const newHead = DBHeadData.encode({
    aevt: snapshot.head.aevt,
    vaet: snapshot.head.vaet,
    avet: toLong(avet),
    eavt: toLong(eavt),
  }).finish();

  await db.backend.put([{ key: DB_HEAD, value: newHead }]);
};
