import { DataIndex, Datom, Snapshot, Indexer, KVBackend } from "@/types";
import { DBHeadData } from "@/generated/protocolBuffers";
import { comparators } from "@/shared/compare";
import { toPointer } from "@/client/common/encoding";

export class TreeIndexedSnapshot implements Snapshot {
  constructor(
    private backend: KVBackend,
    public indexer: Indexer,
    public head: DBHeadData
  ) {}

  public clone() {
    return new TreeIndexedSnapshot(this.backend, this.indexer, this.head);
  }

  private getIndexKey(index: DataIndex): null | Uint8Array {
    const { head } = this;

    const name = DataIndex[index].toLowerCase();

    return toPointer((head as any)[name] || null);
  }

  async getIndex(index: DataIndex) {
    const { backend, indexer } = this;
    const key = this.getIndexKey(index);

    if (key) {
      return indexer.getNode(backend, comparators[index], key);
    } else {
      return null;
    }
  }
}
