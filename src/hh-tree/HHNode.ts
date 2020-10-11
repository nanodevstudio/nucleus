import { Datom, DBHead, IndexNode, KVBackend } from "@/types";
import * as path from "path";
import {
  Datom as HHDatom,
  HHIndexNodeData,
  HHIndexNodeRangePointer,
} from "../generated/protocolBuffers";

type Class = HHIndexNodeData;

export class HHIndexNode implements IndexNode {
  constructor(public DB: DBHead, public nodeData: Class) {}

  findFirstNode() {}

  write(datoms: Datom[]) {}
}
