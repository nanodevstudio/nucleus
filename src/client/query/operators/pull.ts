import { Namespace } from "@/client/namespace";
import { OpenSet } from "./openSet";
import {
  applyFilter,
  DatomSet,
  encodeQueryResult,
  getNamespace,
  getQueryGraph,
  NamespaceOperator,
  Operator,
} from "../operators";
import { QueryNode } from "../queryNodes";
import { PullQuery } from "../nodes/PullQuery";
import { getAttributeKeyword } from "@/client/transact/common";

export class PullOperator<N extends Namespace, R>
  implements NamespaceOperator<N, Promise<R>> {
  constructor(
    public namespace: N,
    public source: Operator<any>,
    public pull: string[]
  ) {}

  [getNamespace](): N {
    return this.namespace;
  }

  [applyFilter](
    apply: (sourceNode: Operator<DatomSet>) => Operator<DatomSet>
  ): NamespaceOperator<N, Promise<R>> {
    return new PullOperator(this.namespace, apply(this.source), this.pull);
  }

  async [encodeQueryResult](result: any): Promise<R> {
    let results = [];

    for await (const value of result) {
      results.push(
        Object.fromEntries(
          value.map((datom: any) => [datom.a.split("/")[1], datom.v])
        )
      );
    }

    return results as any;
  }

  [getQueryGraph](): QueryNode {
    const { source, pull, namespace } = this;

    return new PullQuery(
      source[getQueryGraph](),
      pull.map((value) => getAttributeKeyword(namespace, value))
    );
  }
}

export class PullNamespaceSourceOperator<N extends Namespace, R>
  implements NamespaceOperator<N, Promise<R>> {
  constructor(public namespace: N, public pull: string[]) {}

  [getNamespace](): N {
    return this.namespace;
  }

  [applyFilter](
    apply: (sourceNode: Operator<DatomSet>) => Operator<DatomSet>
  ): NamespaceOperator<N, Promise<R>> {
    const newSource = apply(new OpenSet());

    return new PullOperator(this.namespace, newSource, this.pull);
  }

  [encodeQueryResult](result: any) {
    return result;
  }

  [getQueryGraph](): QueryNode {
    throw new Error("method not implemented");
  }
}
