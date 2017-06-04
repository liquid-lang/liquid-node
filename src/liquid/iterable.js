// @flow

import Range from './range';

const isString = (input: any): boolean => Object.prototype
                  .toString.call(input) === '[object String]';

export default class Iterable<T: (number[] | string)> {
  async first() {
    return this.slice(0, 1).then(a => a[0]);
  }

  async map(...args: (any | Function)[]) {
    const a = await this.toArray();
    return args.map(func => func(a));
  }

  async sort(...args: any[]) {
    return this.toArray().then(a => a.sort(...args));
  }

  async toArray() {
    return this.slice(0);
  }

  async slice(...args: number[]): Promise<T[]> {
    throw new Error(`${this.constructor.name}.slice() not implemented`);
  }

  async last(): Promise<T> {
    throw new Error(`${this.constructor.name}.last() not implemented`);
  }

  static async cast(v: any) {
    if (v instanceof Iterable) {
      return v;
    }
    if (v instanceof Range) {
      return new IterableForArray(v.toArray());
    }
    if (Array.isArray(v)) {
      return new IterableForArray(v);
    }
    if (isString(v)) {
      return new IterableForArray((v: string).split(''));
    }
    if (v != null) {
      return new IterableForArray([v]);
    }
    return new IterableForArray([]);
  }
}

export class IterableForArray<T : (string | number[])> extends Iterable <T> {
  array: T[];
  constructor(array: T[]) {
    super();
    this.array = array;
  }
  async slice(...args: number[]) {
    return this.array.slice(args[0], args[1]);
  }
  async last() {
    return this.array[this.array.length - 1];
  }
}
