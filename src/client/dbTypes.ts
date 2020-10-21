import { Datom } from "@/types";
import { dbNamespace, Namespace } from "./namespace";
import { AVQuery } from "./query/nodes/AVQuery";
import { QueryNode } from "./query/queryNodes";
import { getAttributeKeyword } from "./transact/common";
import { Tx, TxEntityId } from "./transact/tx-types";
import { insert } from "./transact/txs/insert";
import { InsertDatom } from "./transact/txs/insertDatom";

export interface FieldOptions {}

export interface DBType<M, Q = M, V = M> {
  getSchemaTx(namespace: Namespace, attribute: string): Tx;

  transact(
    entityId: TxEntityId,
    namespace: Namespace,
    attribute: string,
    value: M
  ): Tx[];

  getQueryNode(namespace: Namespace, attribute: string, value: Q): QueryNode;
}

export interface ValueType<M> {
  transactWithValue(
    entityId: TxEntityId,
    namespace: Namespace,
    attribute: string,
    value: M
  ): { value: any; transactions: Tx[] };
}

export abstract class SimpleDBType<T, Q> implements DBType<T, Q>, ValueType<T> {
  abstract encode(value: T): any;

  getSchemaTx(namespace: Namespace, attribute: string): Tx {
    return insert(dbNamespace, {
      ident: getAttributeKeyword(namespace, attribute),
    });
  }

  getQueryNode(namespace: Namespace, attribute: string, value: Q) {
    return new AVQuery(attribute, value);
  }

  transact(
    entityId: TxEntityId,
    namespace: Namespace,
    attribute: string,
    value: T
  ): Tx[] {
    return [new InsertDatom(entityId, attribute, this.encode(value))];
  }

  transactWithValue(
    entityId: TxEntityId,
    namespace: Namespace,
    attribute: string,
    value: T
  ) {
    return {
      value: this.encode(value),
      transactions: [],
    };
  }
}

export class DBKeyword extends SimpleDBType<string, string> {
  encode(value: string) {
    return value;
  }
}

export class DBText extends SimpleDBType<string, string> {
  encode(value: string) {
    return value;
  }
}

export class DBInteger extends SimpleDBType<number | bigint, number | bigint> {
  encode(value: number | bigint) {
    return value;
  }
}

export class DBSet<M> implements DBType<M[]> {
  constructor(public valueType: ValueType<M>) {}

  transact(
    entityId: TxEntityId,
    namespace: Namespace,
    attribute: string,
    value: M[]
  ) {
    return value.reduce((txs) => {
      return [...txs, txs[0]];
    }, []);
  }
}

export class DBReference {}
