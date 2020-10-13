import { MaybePromise } from "./types";

export const concatIters = async function* <T>(values: AsyncIterable<T>[]) {
  for (const value of values) {
    yield* value;
  }
};

export const isPromise = (value: any): value is Promise<any> => {
  return value instanceof Promise;
};

export const chain = <T, R>(
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
