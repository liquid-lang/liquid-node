const strftime = require('strftime')
const Iterable = require('./iterable')
const flatten = require('./helpers').flatten

const toObjectString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

const isString = input => toObjectString.call(input) === '[object String]'
const isArray = input => Array.isArray(input)
const isArguments = input => toObjectString(input) === '[object Arguments]'
const isNumber = input => !isArray(input) && (input - parseFloat(input)) >= 0

const toString = input => {
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

const toIterable = input => Iterable.cast(input)

const toDate = input => {
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

const has = (input, key) => (input != null) && hasOwnProperty.call(input, key)

const isEmpty = input => {
  if (input == null) {
    return true
  }
  if (isArray(input) || isString(input) || isArguments(input)) {
    return input.length === 0
  }
  for (const key in input) {
    if (has(key, input)) {
      return false
    }
  }
  return true
}

const isBlank = input => !(isNumber(input) || input === true) && isEmpty(input)

const HTML_ESCAPE = chr => {
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
    return input != null && input.length != null ? input.length : 0
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
    return toString(input)
      .replace(/^([a-z])/, (m, chr) => chr.toUpperCase())
  },
  sort: async function (input, property) {
    if (property == null) {
      return toIterable(input).sort()
    }

    const array = await toIterable(input).map(item => ({
      key: item != null ? item[property] : void 0,
      item
    }))

    return array.sort((a, b) => {
      if (a.key > b.key) return 1
      if (a.key < b.key) return -1
      return 0
    }).map(a => a.item)
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
  truncate: function (input, length = 50, truncateString = '...') {
    input = toString(input)
    truncateString = toString(truncateString)
    length = Number(length)
    const l = Math.max(0, length - truncateString.length)
    if (input.length > length) {
      return input.slice(0, l) + truncateString
    } else {
      return input
    }
  },
  truncatewords: function (input, words = 15, truncateString = '...') {
    input = toString(input)
    const wordlist = input.split(' ')
    words = Math.max(1, Number(words))
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
    const array = toIterable(input).toArray()
    return flatten(array)
  },
  join: function (input, glue = ' ') {
    const array = this.flatten(input)
    return array.join(glue)
  },
  first: function (input) {
    return toIterable(input).first()
  },
  last: function (input) {
    return toIterable(input).last()
  },
  plus: function (input, operand) {
    return Number(input) + Number(operand)
  },
  minus: function (input, operand) {
    return Number(input) - Number(operand)
  },
  times: function (input, operand) {
    return Number(input) * Number(operand)
  },
  dividedBy: function (input, operand) {
    return Number(input) / Number(operand)
  },
  divided_by: function (input, operand) {
    return this.dividedBy(input, operand)
  },
  round: function (input, operand) {
    return Number(input).toFixed(operand)
  },
  modulo: function (input, operand) {
    return Number(input) % Number(operand)
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
  default: function (input, defaultValue) {
    if (arguments.length < 2) {
      defaultValue = ''
    }

    const blank = input && typeof input.isBlank === 'function'
      ? input.isBlank()
      : isBlank(input)

    if (blank) {
      return defaultValue
    } else {
      return input
    }
  }
}
