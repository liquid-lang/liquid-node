module.exports = function reduce (collection, reducer, value) {
  return Promise.all(collection).then(function (items) {
    return items.reduce(function (promise, item, index, length) {
      return promise.then(function (value) {
        return reducer(value, item, index, length)
      })
    }, Promise.resolve(value))
  })
}
