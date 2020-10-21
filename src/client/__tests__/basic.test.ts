import { memoryBackend } from "@/backends/memory";
import { makeBPlusIndexer } from "@/nodes/bplus/BPlusIndexer";
import { DB } from "@/types";
import { makeDatabase } from "../../database/makeDatabase";
import { namespace } from "../namespace";
import { where } from "../query/operators/select";
import { query } from "../query/query";
import { transact } from "../transact/transact";
import { insert } from "../transact/txs/insert";
import * as t from "../typeAPI";

const widget = namespace("widget", {
  name: t.text(),
  description: t.text(),
});

let db: DB;

beforeAll(async () => {
  db = await makeDatabase({
    backend: memoryBackend(),
    indexer: makeBPlusIndexer(10),
  });

  await transact(db, [widget]);

  await transact(db, [
    insert(widget, {
      name: "text",
      description: "A widget for displaying text",
    }),
    insert(widget, {
      name: "button",
      description: "A clickable element",
    }),
  ]);
});

test("can query data by id", async () => {
  const data = await query(
    db,
    where(widget("name", "description"), { name: "text" })
  );

  expect(data).toEqual([
    {
      name: "text",
      description: "A widget for displaying text",
    },
  ]);
});
