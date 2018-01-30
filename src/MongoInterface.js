// @flow

export type MongoCompatibleCursor<T> = {
  fetch(): T[],
  forEach(f: (T => void)): void,
  map<ResultT>(f: (T => ResultT)): ResultT[],
};

export type MongoCompatibleCollection<T> = {
  _name: string,
  findOne: (selector?: {}, options?: {}) => ?T,
  find: (selector?: {}, options?: {}) => MongoCompatibleCursor<T>,
};