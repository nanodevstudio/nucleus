export const toPointer = (value: Long | null) => {
  if (value == null) {
    return null;
  }

  if (value.toInt() === 0) {
    return null;
  }

  const arr = new Uint32Array(2);

  arr[0] = value.low;
  arr[1] = value.high;

  return new Uint8Array(arr.buffer);
};
