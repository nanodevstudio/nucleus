import { Datom } from "@/types";
import { encodeQueryResult, getQueryGraph, Operator } from "../operators";
import { QueryContext, QueryNode, Visitor } from "../queryNodes";

export class OpenSet implements QueryNode, Operator<AsyncIterable<Datom>> {
  constructor() {}

  [encodeQueryResult](result: any): AsyncIterable<Datom> {
    return result;
  }

  [getQueryGraph](): QueryNode {
    return this;
  }

  execute(queryContext: QueryContext) {
    // TODO can this interface return an open set value some how
    // instead of special casing?
    return [];
  }

  visit(visitor: Visitor): void {}
}
