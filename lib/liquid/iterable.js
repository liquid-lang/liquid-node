var Iterable
var IterableForArray
var isString
const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Range = require('./range')

isString = function (input) {
  return Object.prototype.toString.call(input) === '[object String]'
}

module.exports = Iterable = (function () {
  function Iterable () {}

  Iterable.prototype.first = function () {
    return this.slice(0, 1).then(function (a) {
      return a[0]
    })
  }

  Iterable.prototype.map = function () {
    var args
    args = arguments
    return this.toArray().then(function (a) {
      return Promise.all(a.map.apply(a, args))
    })
  }

  Iterable.prototype.sort = function () {
    var args
    args = arguments
    return this.toArray().then(function (a) {
      return a.sort.apply(a, args)
    })
  }

  Iterable.prototype.toArray = function () {
    return this.slice(0)
  }

  Iterable.prototype.slice = function () {
    throw new Error(this.constructor.name + '.slice() not implemented')
  }

  Iterable.prototype.last = function () {
    throw new Error(this.constructor.name + '.last() not implemented')
  }

  Iterable.cast = function (v) {
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

  return Iterable
})()

IterableForArray = (function (superClass) {
  extend(IterableForArray, superClass)

  function IterableForArray (array) {
    this.array = array
  }

  IterableForArray.prototype.slice = function () {
    var ref
    return Promise.resolve((ref = this.array).slice.apply(ref, arguments))
  }

  IterableForArray.prototype.last = function () {
    return Promise.resolve(this.array[this.array.length - 1])
  }

  return IterableForArray
})(Iterable)
