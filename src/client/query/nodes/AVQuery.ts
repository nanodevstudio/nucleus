import { getAttributeId } from "@/client/transact/common";
import { scan } from "@/query";
import { DataIndex, Datom, IndexRange } from "@/types";
import { QueryContext, QueryNode } from "../queryNodes";

export class AVQuery implements QueryNode {
  constructor(public attribute: string, public value: any) {}

  async *execute(ctx: QueryContext) {
    const attributeId = await getAttributeId(ctx.snapshot, this.attribute);
    const lower = new Datom(-Infinity, attributeId, this.value, -Infinity);
    const upper = new Datom(Infinity, attributeId, this.value, Infinity);
    const results = await scan(
      ctx.snapshot,
      DataIndex.AVET,
      new IndexRange(lower, upper)
    );

    yield* results;
  }

  visit() {}
}
