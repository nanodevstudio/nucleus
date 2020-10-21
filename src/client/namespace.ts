import { Snapshot } from "@/types";
import { DBKeyword, DBType } from "./dbTypes";
import { NamespaceOperator } from "./query/operators";
import { PullNamespaceSourceOperator } from "./query/operators/pull";
import { Tx } from "./transact/tx-types";
import { combineTxs } from "./transact/txs/combineTx";
import { insert } from "./transact/txs/insert";
import * as t from "./typeAPI";

type Fields = {
  [name: string]: DBType<any>;
};

type SelectionSegment<F> = keyof F;
type FieldSelection<F> = SelectionSegment<F>[];

export type NamespaceModel<N> = N extends Namespace<any, infer Model>
  ? Model
  : never;

export interface Namespace<N extends string = string, T extends Fields = any>
  extends Tx {
  $namespace: N;
  $fields: T;

  <S extends FieldSelection<T>>(...selector: S): NamespaceOperator<
    Namespace<N, T>,
    any
  >;
}

export function namespace<N extends string, T extends Fields>(
  namespaceId: N,
  fields: T
): Namespace<N, T> {
  const data = {
    $namespace: namespaceId,
    $fields: fields,

    getDatoms: (snapshot: Snapshot) => {
      return combineTxs(
        Object.entries(fields).map(([key, value]) => {
          return value.getSchemaTx(ns, key);
        })
      ).getDatoms(snapshot);
    },
  };

  const ns: Namespace<N, T> = Object.assign((...selection: any[]) => {
    return new PullNamespaceSourceOperator(ns, selection);
  }, data);

  return ns;
}

type DBFields = {
  ident: DBKeyword;
};

export const dbNamespace: Namespace<"db", DBFields> = namespace("db", {
  ident: t.keyword() as any,
});
