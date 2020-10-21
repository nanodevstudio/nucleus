/**
 *
 * pull (name, email)
 *  |
 * and ----------------- role = "admin"
 *  |
 * status = "published"
 *
 */

import { Snapshot } from "@/types";

export interface QueryContext {
  snapshot: Snapshot;
}

export interface Visitor {}

export interface QueryNode {
  execute(queryContext: QueryContext): any;
  visit(visitor: Visitor): void;
}
