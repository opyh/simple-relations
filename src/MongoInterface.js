// @flow

export type MongoCompatibleCursor<T> = {
  fetch(): T[],
  forEach(f: (T => void)): void,
  map<U>(callbackfn: (value: T, index: number, array: any[]) => U, thisArg?: any): $ReadOnlyArray<U> | Array<any>,
  count: (() => number),
};

export type MongoCompatibleCollection<T> = {
  _name: string,
  findOne: (selector?: {} | string, options?: {}) => ?T,
  find: (selector?: {} | string, options?: {}) => MongoCompatibleCursor<T>,
};


export const EmptyCursor: MongoCompatibleCursor<*> = {
  fetch: () => [],
  forEach: () => {},
  map: (): Array<any> => [],
  count: () => 0,
};
