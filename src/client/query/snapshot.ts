import { TreeIndexedSnapshot } from "@/database/TreeIndexedSnapshot";
import { DBHeadData } from "@/generated/protocolBuffers";
import { DB } from "@/types";

const uint8 = (num: number) => {
  const array = new Uint8Array(1);

  array[0] = num;

  return array;
};

export const DB_HEAD = uint8(8);

const getSnapshotHead = async (db: DB) => {
  const headBuffer = await db.backend.get(DB_HEAD);

  if (headBuffer == null) {
    return DBHeadData.create({
      eavt: null,
      aevt: null,
      avet: null,
      vaet: null,
    });
  }

  return DBHeadData.decode(new Uint8Array(headBuffer));
};

export const getSnapshot = async (db: DB) => {
  const head = await getSnapshotHead(db);

  return new TreeIndexedSnapshot(db.backend, db.indexer, head);
};
