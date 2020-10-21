import { Operator } from "../operators";
import { OpenSet } from "./openSet";

export const and = <N>(a: Operator<any>, b: Operator<any>) => {
  if (a instanceof OpenSet) {
    return b;
  }

  if (b instanceof OpenSet) {
    return a;
  }

  throw new Error("intersection not implemented");
};
