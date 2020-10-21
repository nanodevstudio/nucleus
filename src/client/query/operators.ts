import { Datom } from "@/types";
import { Namespace } from "../namespace";
import { QueryNode } from "./queryNodes";

export const encodeQueryResult = Symbol("decodeQueryResult");
export const getQueryGraph = Symbol("getQueryGraph");
export const getNamespace = Symbol("getNamespace");
export const applyFilter = Symbol("applyFilter");

export type DatomSet = SortedSet<Datom>;

export type SortedSet<V> = AsyncIterable<V> | Iterable<V>;

export interface Operator<T> {
  [encodeQueryResult](result: any): T;
  [getQueryGraph](): QueryNode;
}

export interface NamespaceOperator<N extends Namespace<any, any>, R>
  extends Operator<R> {
  [getNamespace](): N;
  [applyFilter](
    apply: (
      sourceNode: Operator<SortedSet<Datom>>
    ) => Operator<SortedSet<Datom>>
  ): NamespaceOperator<N, R>;
}
