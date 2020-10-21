import { DBInteger, DBKeyword, DBReference, DBSet, DBText, DBType, FieldOptions } from "./dbTypes";

const defaultOptions = {};

export const keyword = (options: FieldOptions = defaultOptions) => {
  return new DBKeyword(options);
};

export const text = (options: FieldOptions = defaultOptions) => {
  return new DBText(options);
};

export const integer = (options: FieldOptions = defaultOptions) => {
  return new DBInteger(options);
};

export const set = (value: DBType, options: FieldOptions = defaultOptions) => {
  return new DBSet(value, options);
};

export const ref = (options: FieldOptions = defaultOptions) => {
  return new DBReference(options);
};
