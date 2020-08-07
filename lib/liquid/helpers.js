module.exports = {
  flatten: array => {
    const output = []
    const _flatten = childArray => {
      return childArray.forEach(item => {
        if (Array.isArray(item)) {
          return _flatten(item)
        } else {
          return output.push(item)
        }
      })
    }
    _flatten(array)
    return output
  },
  toFlatString: function (array) {
    return this.flatten(array).join('')
  },
  scan: (string, regexp, globalMatch = false) => {
    const result = []
    const _scan = s => {
      const match = regexp.exec(s)
      if (!match) return
      if (match.length === 1) {
        result.push(match[0])
      } else {
        result.push(match.slice(1))
      }

      const l = globalMatch
        ? 1
        : match[0].length

      if (match.index + l < s.length) {
        return _scan(s.substring(match.index + l))
      }
    }
    _scan(string)
    return result
  }
}
