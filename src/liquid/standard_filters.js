
/* eslint-disable camelcase */
import strftime from 'strftime'
import isEmpty from 'lodash.isempty'
import Promise from 'any-promise'
import Iterable from './iterable'
import { flatten } from './helpers'

const toNumber = input => Number(input)
const isString = input => Object.prototype.toString.call(input) === '[object String]'
const isArray = input => Array.isArray(input)

// from jQuery
const isNumber = input => !isArray(input) && (input - parseFloat(input)) >= 0

const toString = (input) => {
  if (input == null) {
    return ''
  }
  if (isString(input)) {
    return input
  }
  if (typeof input.toString === 'function') {
    toString(input.toString())
  }
  return Object.prototype.toString.call(input)
}
const toIterable = input => Iterable.cast(input)
const toDate = (input) => {
  if (input == null) {
    return
  }
  if (input instanceof Date) {
    return input
  }
  if (input === 'now') {
    return new Date()
  }
  let num = null
  if (isNumber(input)) {
    num = parseInt(input)
  } else {
    num = toString(input)
    if (num.length === 0) return
    num = Date.parse(num)
  }
  if (num) {
    return new Date(num)
  }
}

const isBlank = (input) => {
  return !(isNumber(input) || input === true) && isEmpty(input)
}

const HTML_ESCAPE = (chr) => {
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

/// ////////////////////////////////////////////////////////////////////////////
//                                Exports Below                               //
/// ////////////////////////////////////////////////////////////////////////////
export const StandardFilters = {
  size (input) {
    if (input == null) return 0
    return input.length
  },
  downcase (input) {
    return toString(input).toLocaleLowerCase()
  },
  upcase (input) {
    return toString(input).toLocaleUpperCase()
  },
  append (input, suffix) {
    return `${toString(input)}${toString(suffix)}`
  },
  prepend (input, prefix) {
    return `${toString(prefix)}${toString(input)}`
  },
  empty (input) {
    return isEmpty(input)
  },
  capitalize (input) {
    return toString(input).replace(/^(\w)/, (m, chr) => chr.toLocaleUpperCase())
  },
  sort (input, property = null) {
    if (property === null) {
      return toIterable(input).sort()
    }
    return toIterable(input)
    .map(item => Promise.resolve(item != null ? item[property] : undefined).then(key => ({key, item})))
    .then(array => array.sort((a, b) => (a.key > b.key) ? 1 : ((a.key === b.key) ? 0 : -1))
          .map(a => a.item))
  },
  map (input, property = null) {
    if (property === null) {
      return input
    }
    return toIterable(input)
    .map(e => (e != null) ? e[property] : undefined)
  },
  escape (input) {
    toString(input).replace(HTML_ESCAPE_REGEXP, HTML_ESCAPE)
  },
  escape_once (input) {
    toString(input).replace(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE)
  },

/*
 * References:
 * - http://www.sitepoint.com/forums/showthread.php?218218-Javascript-Regex-making-Dot-match-new-lines
 */
  strip_html (input) {
    return toString(input)
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]*?>/g, '')
  },

  strip_newlines (input) {
    return toString(input).replace(/\r?\n/g, '')
  },

  newline_to_br (input) {
    return toString(input).replace(/\n/g, '<br />\n')
  },

/*
 * To be accurate, we might need to escape special chars in the string
 *
 * References
 * - http://stackoverflow.com/a/1144788/179691
 */
  replace (input, string, replacement = '') {
    return toString(input).replace(new RegExp(string, 'g'), replacement)
  },
  replace_first (input, string, replacement = '') {
    return toString(input).replace(string, replacement)
  },

  remove (input, string) {
    return this.replace(input, string)
  },
  remove_first (input, string) {
    return this.replace_first(input, string)
  },
  truncate (input, length = 50, truncateString = '...') {
    input = toString(input)
    truncateString = toString(truncateString)
    length = toNumber(length)

    const l = ((length - truncateString.length) < 0) ? 0 : (length - truncateString.length)
    if (input.length > length) {
      return input.slice(0, l) + truncateString
    }
    return input
  },
  truncatewords (input, words = 15, truncateString = '...') {
    input = toString(input)
    words = Math.max(1, toNumber(words))
    const wordlist = input.split(' ')
    if (wordlist.length > words) {
      return wordlist.slice(0, words).join(' ') + truncateString
    }
    return input
  },
  split (input, pattern) {
    input = toString(input)
    if (input == null) return
    return input.split(pattern)
  },

// TODO!!!

  flatten (input) {
    return toIterable(input).then(a => flatten(a))
  },
  join (input, glue = ' ') {
    return this.flatten(input).then(a => a.join(glue))
  },

// TODO!!!

/**
 * Get the first element of the passed-in array
 *
 * Example:
 *    {{ product.images | first | to_img }}
 */
  first (input) {
    toIterable(input).first()
  },

/**
 * Get the last element of the passed-in array
 *
 * Example:
 *    {{ product.images | last | to_img }}
 */
  last (input) {
    toIterable(input).last()
  },

  plus (input, operand) {
    return toNumber(input) + toNumber(operand)
  },
  minus (input, operand) {
    return toNumber(input) - toNumber(operand)
  },
  times (input, operand) {
    return toNumber(input) * toNumber(operand)
  },
  dividedBy (input, operand) {
    return toNumber(input) / toNumber(operand)
  },
  divided_by (input, operand) {
    return this.dividedBy(input, operand)
  },
  round (input, operand) {
    return toNumber(input).toFixed(operand)
  },
  modulo (input, operand) {
    return toNumber(input) % toNumber(operand)
  },
  date (input, format) {
    input = toDate(input)
    if (input == null) {
      return ''
    } else if (toString(format).length === 0) {
      return input.toUTCString()
    } else {
      return strftime(format, input)
    }
  },
  default (input, defaultValue = '') {
    if (input == null) {
      return defaultValue
    }
    if (typeof input.isBlank === 'function') {
      if (input.isBlank()) {
        return defaultValue
      }
      return input
    }
    if (isBlank(input)) {
      return defaultValue
    }
    return input
  }
}
