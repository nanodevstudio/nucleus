import { DBType } from "@/client/dbTypes";
import { Namespace, NamespaceModel } from "@/client/namespace";
import { getAttribute, getAttributeKeyword } from "@/client/transact/common";
import {
  getQueryGraph,
  encodeQueryResult,
  NamespaceOperator,
  Operator,
  applyFilter,
  getNamespace,
} from "../operators";
import { QueryNode } from "../queryNodes";
import { and } from "./and";

export class SelectOperator<O> implements Operator<O> {
  constructor(public namespace: Namespace, public query: SelectFilter<any>[]) {}

  [getQueryGraph](): QueryNode {
    const { query, namespace } = this;

    return query
      .flatMap((value) => {
        return Object.entries(value).map(([key, value]) => {
          const attribute = getAttribute(namespace, key);
          const keyword = getAttributeKeyword(namespace, key);
          return attribute.getQueryNode(this.namespace, keyword, value);
        });
      })
      .reduce((a, b) => intersection(a, b));
  }

  [encodeQueryResult](value: any): O {
    return value;
  }
}

type QueryValue<N> = N extends DBType<any, infer Query, any> ? Query : never;
type SelectFilterOfModel<M> = Partial<{ [key in keyof M]: QueryValue<M[key]> }>;
type SelectFilter<N> = SelectFilterOfModel<NamespaceModel<N>>;

export const where = <N extends Namespace<any, any>, R>(
  input: NamespaceOperator<N, R>,
  ...filters: SelectFilter<N>[]
) => {
  return input[applyFilter]((sourceNode) => {
    return and(sourceNode, new SelectOperator(input[getNamespace](), filters));
  });
};
