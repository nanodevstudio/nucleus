import { concatIters } from "./seq";
import {
  DataIndex,
  Datom,
  DB,
  GeneralNode,
  IndexRange,
  MaybePromise,
  NodeType,
} from "./types";

const isPromise = (value: any): value is Promise<any> => {
  return value instanceof Promise;
};

const chain = <T, R>(
  value: MaybePromise<T>,
  result: (value: T) => MaybePromise<R>
): MaybePromise<R> => {
  if (isPromise(value)) {
    return value.then((value) => {
      return result(value);
    });
  }

  return result(value);
};

class PromiseIterator<V> implements AsyncIterator<V> {
  iterator: AsyncIterator<V> | null;

  constructor(public value: Promise<AsyncIterable<V>>) {
    this.iterator = null;
  }

  async next() {
    if (!this.iterator) {
      const iterable = await this.value;
      const create =
        iterable[Symbol.asyncIterator]?.() ||
        (iterable as any)[Symbol.iterator]?.();
      this.iterator = iterable[Symbol.asyncIterator]();
    }

    return this.iterator.next();
  }
}

class PromiseIterable<V> implements AsyncIterable<V> {
  constructor(public value: Promise<AsyncIterable<V>>) {}

  [Symbol.asyncIterator]() {
    return new PromiseIterator(this.value);
  }
}

const asIter = <V>(value: MaybePromise<AsyncIterable<V>>) => {
  if (isPromise(value)) {
    return new PromiseIterable(value);
  }

  return value;
};

const scanBetween = (
  node: GeneralNode | null,
  start?: Datom,
  end?: Datom
): AsyncIterable<Datom> => {
  if (node === null) {
    return [] as any;
  }

  if (node?.type === NodeType.data) {
    return node.getData(start, end) as any;
  }

  const indexNode = node;
  const startIndex = start
    ? indexNode.findNextNode(start)
    : indexNode.findFirstNode();
  const endIndex = end ? indexNode.findNextNode(end) : indexNode.findLastNode();

  if (endIndex === startIndex) {
    return asIter(
      chain(indexNode.getNode(startIndex), (node) =>
        scanBetween(node, start, end)
      )
    );
  }

  let startScan = chain(indexNode.getNode(startIndex), (node) =>
    scanBetween(node, start)
  );

  const scans = [startScan];

  const middleScans = endIndex - startIndex;
  for (let i = 1; i < middleScans; i++) {
    scans.push(chain(indexNode.getNode(startIndex + i), scanBetween));
  }

  scans.push(
    chain(indexNode.getNode(endIndex), (node) =>
      scanBetween(node, undefined, end)
    )
  );

  return asIter(Promise.all(scans).then(concatIters));
};

export const scan = (db: DB, index: DataIndex, range: IndexRange) => {
  const indexNode = db.getIndex(index);
  return scanBetween(indexNode, range.lower, range.upper);
};
