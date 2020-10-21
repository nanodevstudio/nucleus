import { DB } from "@/types";
import { Operator, getQueryGraph, encodeQueryResult } from "./operators";
import { getSnapshot } from "./snapshot";

export const query = async <R>(db: DB, operator: Operator<R>) => {
  const queryNode = operator[getQueryGraph]();
  const snapshot = await getSnapshot(db);
  const result = queryNode.execute({ snapshot: snapshot });

  return operator[encodeQueryResult](result);
};
