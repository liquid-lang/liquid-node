import Range from './range'
import Promise from 'any-promise'

const isString = input => Object.prototype.toString.call(input) === '[object String]'

class Iterable {
  first () {
    return this.slice(0, 1).then(a => a[0])
  }

  map (...args) {
    return this.toArray().then(a => Promise.all(a.map(...args)))
  }

  sort (...args) {
    return this.toArray().then(a => a.sort(...args))
  }

  toArray () {
    return this.slice(0)
  }

  slice () {
    throw new Error(this.constructor.name + '.slice() not implemented')
  }

  last () {
    throw new Error(this.constructor.name + '.last() not implemented')
  }

  static cast (v) {
    if (v instanceof Iterable) {
      return v
    } else if (v instanceof Range) {
      return new IterableForArray(v.toArray())
    } else if (Array.isArray(v) || isString(v)) {
      return new IterableForArray(v)
    } else if (v != null) {
      return new IterableForArray([v])
    } else {
      return new IterableForArray([])
    }
  }
}

class IterableForArray extends Iterable {
  constructor (array) {
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

export default Iterable
