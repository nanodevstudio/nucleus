import { getAttributeId } from "@/client/transact/common";
import { scan } from "@/query";
import { DataIndex, Datom, IndexRange, Snapshot, UINT64 } from "@/types";
import { DatomSet } from "../operators";
import { QueryContext, QueryNode, Visitor } from "../queryNodes";
import { sort, sortBy } from "ramda";

const pull = async (
  snapshot: Snapshot,
  entityId: any,
  attributes: UINT64[]
) => {
  const low = new Datom(entityId, attributes[0], -Infinity, -Infinity);
  const high = new Datom(
    entityId,
    attributes[attributes.length - 1],
    Infinity,
    Infinity
  );
  const results = await scan(
    snapshot,
    DataIndex.EAVT,
    new IndexRange(low, high)
  );

  const datoms = [];

  for await (const result of results) {
    if (attributes.includes(result.a! as any)) {
      datoms.push(result);
    }
  }

  return datoms;
};

export class PullQuery implements QueryNode {
  constructor(public source: QueryNode, public pattern: string[]) {}

  async *execute(ctx: QueryContext) {
    const { pattern } = this;
    const source: DatomSet = this.source.execute(ctx);
    const attributeIds = await Promise.all(
      pattern.map((attribute) => getAttributeId(ctx.snapshot, attribute))
    );
    const sortedAttributes = sortBy((value) => value as any, attributeIds);

    for await (const datom of source) {
      const value = await pull(ctx.snapshot, datom.e, sortedAttributes);
      const withAttributes = value.map((value) => {
        const index = attributeIds.findIndex(
          (attribute) => value.a === attribute
        );
        return new Datom(value.e, pattern[index], value.v, value.t);
      });

      yield withAttributes;
    }
  }

  visit(visitor: Visitor) {}
}
