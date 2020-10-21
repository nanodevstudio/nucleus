import { scan } from "@/query";
import { Clone, DataIndex, Datom, IndexRange, Snapshot, UINT64 } from "@/types";
import { DBType } from "../dbTypes";
import { Namespace } from "../namespace";
import { TxEntityId } from "./tx-types";

export const first = async <T>(value: AsyncIterable<T>) => {
  for await (const item of value) {
    return item;
  }
};

export const getAttributeId = async (
  snapshot: Snapshot,
  string: string
): Promise<UINT64> => {
  if (string === "db/ident") {
    return 0n;
  }

  const result = await scan(
    snapshot,
    DataIndex.AVET,
    new IndexRange(
      new Datom(-Infinity, 0n, string, -Infinity),
      new Datom(Infinity, 0n, string, Infinity)
    )
  );

  const datom = await first(result);

  if (datom == null) {
    throw new Error(`could not find attribute ${string}`);
  }

  return datom.e!;
};

const symbolInterface = <T>(name: string, defaultValue: () => T) => {
  const symbol = Symbol(name);

  return {
    get<R>(value: Clone<any>): T {
      if ((value as any)[symbol] == null) {
        const newValue = defaultValue();
        this.set(value, newValue);

        return newValue;
      }

      return (value as any)[symbol];
    },

    set<R>(value: Clone<R>, symbolValue: T): R {
      (value as any)[symbol] = symbolValue;

      return value as any;
    },
  };
};

const idResolutions = symbolInterface("idResolutions", () => new Map());

export const setResolvedId = (
  snapshot: Snapshot,
  id: Symbol | bigint,
  value: any
) => {
  if (typeof id === "bigint") {
    return snapshot;
  }

  const values = idResolutions.get(snapshot);

  values.set(id, value);

  return snapshot;
};

export const resolveId = (snapshot: Snapshot, id: TxEntityId) => {
  if (typeof id === "bigint") {
    return id;
  }

  return idResolutions.get(snapshot).get(id);
};

export const getT = (snapshot: Snapshot) => {
  return 0;
};

export const getAttributeKeyword = (
  namespace: Namespace,
  attribute: string
) => {
  return `${namespace.$namespace}/${attribute}`;
};

export const getAttribute = (
  namespace: Namespace,
  attribute: string
): DBType<any> => {
  return namespace.$fields[attribute];
};
