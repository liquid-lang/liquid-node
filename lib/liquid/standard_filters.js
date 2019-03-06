const strftime = require('strftime')
const Iterable = require('./iterable')
const flatten = require('./helpers').flatten

const toNumber = function (input) {
  return Number(input)
}

const toObjectString = Object.prototype.toString

const hasOwnProperty = Object.prototype.hasOwnProperty

const isString = function (input) {
  return toObjectString.call(input) === '[object String]'
}

const isArray = function (input) {
  return Array.isArray(input)
}

const isArguments = function (input) {
  return toObjectString(input) === '[object Arguments]'
}

const isNumber = function (input) {
  return !isArray(input) && (input - parseFloat(input)) >= 0
}

const toString = function (input) {
  if (input == null) {
    return ''
  } else if (isString(input)) {
    return input
  } else if (typeof input.toString === 'function') {
    return toString(input.toString())
  } else {
    return toObjectString.call(input)
  }
}

const toIterable = function (input) {
  return Iterable.cast(input)
}

const toDate = function (input) {
  if (input == null) {
    return
  }
  if (input instanceof Date) {
    return input
  }
  if (input === 'now') {
    return new Date()
  }
  if (isNumber(input)) {
    input = parseInt(input)
  } else {
    input = toString(input)
    if (input.length === 0) {
      return
    }
    input = Date.parse(input)
  }
  if (input != null) {
    return new Date(input)
  }
}

const has = function (input, key) {
  return (input != null) && hasOwnProperty.call(input, key)
}

const isEmpty = function (input) {
  var key
  if (input == null) {
    return true
  }
  if (isArray(input) || isString(input) || isArguments(input)) {
    return input.length === 0
  }
  for (key in input) {
    if (has(key, input)) {
      return false
    }
  }
  return true
}

const isBlank = function (input) {
  return !(isNumber(input) || input === true) && isEmpty(input)
}

const HTML_ESCAPE = function (chr) {
  switch (chr) {
    case '&':
      return '&amp;'
    case '>':
      return '&gt;'
    case '<':
      return '&lt;'
    case '"':
      return '&quot;'
    case "'":
      return '&#39;'
  }
}

const HTML_ESCAPE_ONCE_REGEXP = /["><']|&(?!([a-zA-Z]+|(#\d+));)/g

const HTML_ESCAPE_REGEXP = /([&><"'])/g

module.exports = {
  size: function (input) {
    var ref
    return (ref = input != null ? input.length : void 0) != null ? ref : 0
  },
  downcase: function (input) {
    return toString(input).toLowerCase()
  },
  upcase: function (input) {
    return toString(input).toUpperCase()
  },
  append: function (input, suffix) {
    return toString(input) + toString(suffix)
  },
  prepend: function (input, prefix) {
    return toString(prefix) + toString(input)
  },
  empty: function (input) {
    return isEmpty(input)
  },
  capitalize: function (input) {
    return toString(input).replace(/^([a-z])/, function (m, chr) {
      return chr.toUpperCase()
    })
  },
  sort: function (input, property) {
    if (property == null) {
      return toIterable(input).sort()
    }
    return toIterable(input).map(function (item) {
      return Promise.resolve(item != null ? item[property] : void 0).then(function (key) {
        return {
          key: key,
          item: item
        }
      })
    }).then(function (array) {
      return array.sort(function (a, b) {
        var ref, ref1
        return (ref = a.key > b.key) != null ? ref : {
          1: (ref1 = a.key === b.key) != null ? ref1 : {
            0: -1
          }
        }
      }).map(function (a) {
        return a.item
      })
    })
  },
  map: function (input, property) {
    if (property == null) {
      return input
    }
    return toIterable(input).map(function (e) {
      return e != null ? e[property] : void 0
    })
  },
  escape: function (input) {
    return toString(input).replace(HTML_ESCAPE_REGEXP, HTML_ESCAPE)
  },
  escape_once: function (input) {
    return toString(input).replace(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE)
  },
  strip_html: function (input) {
    return toString(input).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*?>/g, '')
  },
  strip_newlines: function (input) {
    return toString(input).replace(/\r?\n/g, '')
  },
  newline_to_br: function (input) {
    return toString(input).replace(/\n/g, '<br />\n')
  },
  replace: function (input, string, replacement) {
    if (replacement == null) {
      replacement = ''
    }
    return toString(input).replace(new RegExp(string, 'g'), replacement)
  },
  replace_first: function (input, string, replacement) {
    if (replacement == null) {
      replacement = ''
    }
    return toString(input).replace(string, replacement)
  },
  remove: function (input, string) {
    return this.replace(input, string)
  },
  remove_first: function (input, string) {
    return this.replace_first(input, string)
  },
  truncate: function (input, length, truncateString) {
    var l
    if (length == null) {
      length = 50
    }
    if (truncateString == null) {
      truncateString = '...'
    }
    input = toString(input)
    truncateString = toString(truncateString)
    length = toNumber(length)
    l = length - truncateString.length
    if (l < 0) {
      l = 0
    }
    if (input.length > length) {
      return input.slice(0, l) + truncateString
    } else {
      return input
    }
  },
  truncatewords: function (input, words, truncateString) {
    var wordlist
    if (words == null) {
      words = 15
    }
    if (truncateString == null) {
      truncateString = '...'
    }
    input = toString(input)
    wordlist = input.split(' ')
    words = Math.max(1, toNumber(words))
    if (wordlist.length > words) {
      return wordlist.slice(0, words).join(' ') + truncateString
    } else {
      return input
    }
  },
  split: function (input, pattern) {
    input = toString(input)
    if (!input) {
      return
    }
    return input.split(pattern)
  },
  flatten: function (input) {
    return toIterable(input).toArray().then(function (a) {
      return flatten(a)
    })
  },
  join: function (input, glue) {
    if (glue == null) {
      glue = ' '
    }
    return this.flatten(input).then(function (a) {
      return a.join(glue)
    })
  },
  first: function (input) {
    return toIterable(input).first()
  },
  last: function (input) {
    return toIterable(input).last()
  },
  plus: function (input, operand) {
    return toNumber(input) + toNumber(operand)
  },
  minus: function (input, operand) {
    return toNumber(input) - toNumber(operand)
  },
  times: function (input, operand) {
    return toNumber(input) * toNumber(operand)
  },
  dividedBy: function (input, operand) {
    return toNumber(input) / toNumber(operand)
  },
  divided_by: function (input, operand) {
    return this.dividedBy(input, operand)
  },
  round: function (input, operand) {
    return toNumber(input).toFixed(operand)
  },
  modulo: function (input, operand) {
    return toNumber(input) % toNumber(operand)
  },
  date: function (input, format) {
    input = toDate(input)
    if (input == null) {
      return ''
    } else if (toString(format).length === 0) {
      return input.toUTCString()
    } else {
      return strftime(format, input)
    }
  },
  'default': function (input, defaultValue) {
    var blank, ref
    if (arguments.length < 2) {
      defaultValue = ''
    }
    blank = (ref = input != null ? typeof input.isBlank === 'function' ? input.isBlank() : void 0 : void 0) != null ? ref : isBlank(input)
    if (blank) {
      return defaultValue
    } else {
      return input
    }
  }
}
