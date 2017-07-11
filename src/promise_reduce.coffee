
reduce = (collection, reducer, value) ->
  Promise.all(collection).then (items) ->
    items.reduce (promise, item, index, length) ->
      promise.then (value) ->
        reducer(value, item, index, length)
    , Promise.resolve(value)


module.exports = reduce
