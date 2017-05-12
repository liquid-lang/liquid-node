// @flow
import Range from './range'
import Promise from 'any-promise'

const isString = input => Object.prototype.toString.call(input) === '[object String]'

export default class Iterable<T> {
  first () {
    return this.slice(0, 1).then(a => a[0])
  }

  map (...args: Array<mixed | Function>): Promise<T> {
    return this.toArray().then(a => Promise.all(a.map(...args)))
  }

  sort (...args: Array<mixed | Function>): Promise<T> {
    return this.toArray().then(a => a.sort(...args))
  }

  toArray (): Promise<T> {
    return Promise.resolve(this.slice(0))
  }

  slice () {
    throw new Error(`${this.constructor.name}.slice() not implemented`)
  }

  last () {
    throw new Error(`${this.constructor.name}.last() not implemented`)
  }

  static cast (v/*: mixed | Array<mixed> */) {
    if (v instanceof Iterable) {
      return v
    }
    if (v instanceof Range) {
      return new IterableForArray(v.toArray())
    }
    if (Array.isArray(v)) {
      return new IterableForArray((v: string).split(''))
    }
    if (isString(v)) {
      return new IterableForArray(v.split(''))
    }
    if (v != null) {
      return new IterableForArray([v])
    }
    return new IterableForArray([])
  }
}

export class IterableForArray<T> extends Iterable<T> {
  array: Array<T>
  constructor (array/*: Array<T> */) {
    super()
    this.array = array
  }
  slice (...args) {
    return Promise.resolve(this.array.slice(...args))
  }
  last () {
    return Promise.resolve(this.array[this.array.length - 1])
  }
}
