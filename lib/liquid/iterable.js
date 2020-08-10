const Range = require('./range')

const isString = input => {
  return Object.prototype.toString.call(input) === '[object String]'
}

class Iterable {
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

  first () {
    const array = this.toArray()
    return array[0]
  }

  async map (mapper) {
    const array = this.toArray()
    return Promise.all(array.map(mapper))
  }

  sort (sorter) {
    const array = this.toArray()
    return array.sort(sorter)
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
}

class IterableForArray extends Iterable {
  constructor (array) {
    super()
    this.array = array
  }

  slice () {
    return this.array.slice.apply(this.array, arguments)
  }

  last () {
    return this.array[this.array.length - 1]
  }
}

module.exports = Iterable
