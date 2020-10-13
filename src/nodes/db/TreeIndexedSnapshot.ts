import { DataIndex, Datom, Snapshot, Indexer, KVBackend } from "@/types";
import { DBHeadData } from "@/generated/protocolBuffers";
import { indexers } from "@/shared/compare";

const uint8 = (num: number) => {
  const buf = Buffer.alloc(4);

  buf.writeUInt8(num, 0);

  return buf;
};

const DB_HEAD = uint8(0);

export class TreeIndexedSnapshot implements Snapshot {
  constructor(
    private backend: KVBackend,
    private indexer: Indexer,
    private head: DBHeadData
  ) {}

  async writeDatoms(datoms: Datom[]) {
    const indexes = [DataIndex.EAVT, DataIndex.AEVT];

    const entries = await Promise.all(
      indexes.map(async (index) => {
        const key = this.getIndexKey(index);
        const comparator = indexers[index];
        const sortedDatoms = datoms
          .slice()
          .sort((a, b) => comparator.compare(a, b));

        const value = await this.indexer.writeDatoms(
          this.backend,
          comparator,
          key,
          sortedDatoms
        );

        return [DataIndex[index].toLowerCase(), value] as [string, Buffer];
      })
    );

    const data = DBHeadData.create({
      vaet: 0,
      avet: 0,
      ...Object.fromEntries(entries),
    });

    return new TreeIndexedSnapshot(this.backend, this.indexer, data);
  }

  private getIndexKey(index: DataIndex): null | Buffer {
    const { head } = this;
    const name = DataIndex[index].toLowerCase();
    return (head as any)[name] || null;
  }

  async getIndex(index: DataIndex) {
    const { backend, indexer } = this;
    const key = this.getIndexKey(index);

    if (key) {
      return indexer.getNode(backend, indexers[index], key);
    } else {
      return null;
    }
  }
}
