import { dbNamespace } from "@/client/namespace";
import { DB_HEAD } from "@/client/query/snapshot";
import { transact } from "@/client/transact/transact";
import { insert } from "@/client/transact/txs/insert";
import { DB, Indexer, KVBackend } from "@/types";

interface DatabaseOptions {
  backend: KVBackend;
  indexer: Indexer;
}

const writeFirstHead = async (db: DB) => {
  await transact(db, [insert(dbNamespace, { $id: "0", ident: "db/ident" })]);

  return db;
};

export const makeDatabase = async ({
  backend,
  indexer,
}: DatabaseOptions): Promise<DB> => {
  const db = {
    backend,
    indexer,
  };

  const value = await backend.get(DB_HEAD);

  if (value == null) {
    return writeFirstHead(db);
  }

  return db;
};
