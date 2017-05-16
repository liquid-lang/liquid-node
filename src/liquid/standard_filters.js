
/* eslint-disable camelcase */
import strftime from 'strftime'
import isEmpty from 'lodash.isempty'
import Promise from 'any-promise'
import Iterable from './iterable'
import { flatten as _flatten } from './helpers'

const toNumber = input => Number(input)
const isString = input => Object.prototype.toString.call(input) === '[object String]'
const isArray = input => Array.isArray(input)

// const isNumber = input => !Number.isNaN(input)
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
    return toString(input.toString())
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

const StandardFilters = new Map()

StandardFilters.set('size', input => {
  if (input == null) return 0
  if (input.length === undefined) return 0
  return input.length
})
StandardFilters.set('downcase', input => toString(input).toLocaleLowerCase())
StandardFilters.set('upcase', input => toString(input).toLocaleUpperCase())
StandardFilters.set('append', (input, suffix) => `${toString(input)}${toString(suffix)}`)
StandardFilters.set('prepend', (input, prefix) => `${toString(prefix)}${toString(input)}`)
StandardFilters.set('empty', input => isEmpty(input))
StandardFilters.set('capitalize', input => toString(input).replace(/^(\w)/, (m, chr) => chr.toLocaleUpperCase()))
StandardFilters.set('sort', (input, property = null) => {
  if (property === null) {
    return toIterable(input).sort()
  }
  return toIterable(input)
        .map(item => Promise.resolve(item != null ? item[property] : undefined)
            .then(key => ({key, item})))
        .then(array => array.sort((a, b) => (a.key > b.key) ? 1 : ((a.key === b.key) ? 0 : -1))
        .map(a => a.item))
})
StandardFilters.set('map', (input, property = null) => {
  if (property === null) {
    return input
  }
  return toIterable(input)
    .map((e) => { if (e != null) return e[property] })
})
StandardFilters.set('escape', input => toString(input).replace(HTML_ESCAPE_REGEXP, HTML_ESCAPE))
StandardFilters.set('escape_once', input => toString(input).replace(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE))

/*
 * References:
 * - http://www.sitepoint.com/forums/showthread.php?218218-Javascript-Regex-making-Dot-match-new-lines
 */
StandardFilters.set('strip_html', input => toString(input)
.replace(/<script[\s\S]*?<\/script>/g, '')
.replace(/<!--[\s\S]*?-->/g, '')
.replace(/<style[\s\S]*?<\/style>/g, '')
.replace(/<[^>]*?>/g, '')
)
StandardFilters.set('strip_newlines', input => toString(input).replace(/\r?\n/g, ''))
StandardFilters.set('newline_to_br', input => toString(input).replace(/\n/g, '<br />\n'))

/*
 * To be accurate, we might need to escape special chars in the string
 *
 * References
 * - http://stackoverflow.com/a/1144788/179691
 */
StandardFilters.set('replace', (input, string, replacement = '') => toString(input).replace(new RegExp(string, 'g'), replacement))
StandardFilters.set('replace_first', (input, string, replacement = '') => toString(input).replace(string, replacement))

StandardFilters.set('remove', (input, string) => StandardFilters.get('replace')(input, string))
StandardFilters.set('remove_first', (input, string) => StandardFilters.get('replace_first')(input, string))

StandardFilters.set('truncate', (input, length = 50, truncateString = '...') => {
  input = toString(input)
  truncateString = toString(truncateString)
  length = toNumber(length)

  const l = ((length - truncateString.length) < 0) ? 0 : (length - truncateString.length)
  if (input.length > length) {
    return input.slice(0, l) + truncateString
  }
  return input
})
StandardFilters.set('truncatewords', (input, words = 15, truncateString = '...') => {
  input = toString(input)
  words = Math.max(1, toNumber(words))
  const wordlist = input.split(' ')
  if (wordlist.length > words) {
    return wordlist.slice(0, words).join(' ') + truncateString
  }
  return input
})
StandardFilters.set('split', (input, pattern) => {
  input = toString(input)
  if (!input) return
  return input.split(pattern)
})

// TODO!!!

StandardFilters.set('flatten', input => toIterable(input).then(a => _flatten(a)))
StandardFilters.set('join', (input, glue = ' ') => StandardFilters.get('flatten')(input).then(a => a.join(glue)))

// TODO!!!

/**
 * Get the first element of the passed-in array
 *
 * Example:
 *    {{ product.images | first | to_img }}
 */
StandardFilters.set('first', input => toIterable(input).first())

/**
 * Get the last element of the passed-in array
 *
 * Example:
 *    {{ product.images | last | to_img }}
 */
StandardFilters.set('last', input => toIterable(input).last())

StandardFilters.set('plus', (input, operand) => toNumber(input) + toNumber(operand))
StandardFilters.set('minus', (input, operand) => toNumber(input) - toNumber(operand))
StandardFilters.set('times', (input, operand) => toNumber(input) * toNumber(operand))
StandardFilters.set('dividedBy', (input, operand) => toNumber(input) / toNumber(operand))
StandardFilters.set('divided_by', (input, operand) => StandardFilters.get('dividedBy')(input, operand))
StandardFilters.set('round', (input, operand) => toNumber(input).toFixed(operand))
StandardFilters.set('modulo', (input, operand) => toNumber(input) % toNumber(operand))
StandardFilters.set('date', (input, format) => {
  input = toDate(input)
  if (input == null) {
    return ''
  } else if (toString(format).length === 0) {
    return input.toUTCString()
  } else {
    return strftime(format, input)
  }
})
StandardFilters.set('default', (input, defaultValue = '') => {
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
})

export default StandardFilters
