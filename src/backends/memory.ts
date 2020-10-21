import { KVBackend, KVEntry } from "@/types";

let minimumPointer = 10_000_000n;

class MemoryKVBackend implements KVBackend {
  kv = new Map<string, Uint8Array>();
  currentPointer = minimumPointer;

  encodeKey(key: Uint8Array) {
    const buffer = Buffer.from(key);
    return buffer.toString("base64");
  }

  get(key: Uint8Array): Uint8Array | null {
    return this.kv.get(this.encodeKey(key)) || null;
  }

  put(entries: KVEntry[]) {
    entries.forEach((entry) => {
      this.kv.set(this.encodeKey(entry.key), entry.value);
    });
  }

  getAll(keys: Uint8Array[]) {
    return keys.map((key) => this.get(key));
  }

  getPointer() {
    const array = new BigUint64Array(1);
    array[0] = this.currentPointer += 1n;

    return new Uint8Array(array.buffer);
  }
}

export const memoryBackend = (): KVBackend => {
  return new MemoryKVBackend();
};
