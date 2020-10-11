export const concatIters = async function* <T>(values: AsyncIterable<T>[]) {
  for (const value of values) {
    yield* value;
  }
};
