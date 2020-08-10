module.exports = async function reduce (collection, reducer, value) {
  const items = await Promise.all(collection)
  return items.reduce(async (promise, item, index, length) => {
    const value = await promise
    return reducer(value, item, index, length)
  }, Promise.resolve(value))
}
