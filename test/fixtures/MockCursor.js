// @flow

export default class MockCursor<T> {
  array: T[];

  constructor(array: T[]) {
    this.array = array;
  }

  fetch() {
    return this.array;
  }

  forEach(f: (T => void)): void {
    return this.array.forEach(f);
  }

  map<ResultT>(f: (T => ResultT)): ResultT[] {
    return this.array.map(f);
  }
}
