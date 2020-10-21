import { DBType } from "@/client/dbTypes";
import { Namespace, NamespaceModel } from "@/client/namespace";
import { Snapshot } from "@/types";
import { getAttribute, getAttributeKeyword, setResolvedId } from "../common";
import { Tx } from "../tx-types";

type MutationValue<Type> = Type extends DBType<infer M> ? M : never;
type Data<M> = Partial<
  { $id: string } & {
    [key in keyof M]: MutationValue<M[key]>;
  }
>;

class InsertTx implements Tx {
  constructor(public id: Symbol | bigint, public subTxs: Tx[]) {}

  async getDatoms(snapshot: Snapshot) {
    setResolvedId(snapshot, this.id, snapshot.indexer.entityId());

    const results = await Promise.all(
      this.subTxs.map((value) => value.getDatoms(snapshot))
    );

    return results.flat();
  }
}

export const insert = <N extends Namespace<any, any>>(
  namespace: N,
  data: Data<NamespaceModel<N>>
) => {
  const id = data.$id ? BigInt(data.$id) : Symbol("insert");

  return new InsertTx(
    id,
    Object.entries(data).flatMap(([key, value]) => {
      if (key === "$id") {
        return [];
      }

      const attribute = getAttributeKeyword(namespace, key);
      const type = getAttribute(namespace, key);

      return type.transact(id, namespace, attribute, value);
    })
  );
};
