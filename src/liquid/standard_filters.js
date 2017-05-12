
/* eslint-disable camelcase */
import strftime from 'strftime'
import isEmpty from 'lodash.isempty'
import Promise from 'any-promise'
import Iterable from './iterable'
import { flatten as _flatten } from './helpers'

export const toNumber = input => Number(input)
export const isString = input => Object.prototype.toString.call(input) === '[object String]'
export const isArray = input => Array.isArray(input)

// const isNumber = input => !Number.isNaN(input)
// from jQuery
export const isNumber = input => !isArray(input) && (input - parseFloat(input)) >= 0

export const toString = (input) => {
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
export const toIterable = input => Iterable.cast(input)
export const toDate = (input) => {
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

export const isBlank = (input) => {
  return !(isNumber(input) || input === true) && isEmpty(input)
}

export const HTML_ESCAPE = (chr) => {
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

export const HTML_ESCAPE_ONCE_REGEXP = /["><']|&(?!([a-zA-Z]+|(#\d+));)/g

export const HTML_ESCAPE_REGEXP = /([&><"'])/g

/// ////////////////////////////////////////////////////////////////////////////
//                                Exports Below                               //
/// ////////////////////////////////////////////////////////////////////////////

export const size = input => {
  if (input == null) return 0
  if (input.length === undefined) return 0
  return input.length
}
export const downcase = input => toString(input).toLocaleLowerCase()
export const upcase = input => toString(input).toLocaleUpperCase()
export const append = (input, suffix) => `${toString(input)}${toString(suffix)}`
export const prepend = (input, prefix) => `${toString(prefix)}${toString(input)}`
export const empty = input => isEmpty(input)
export const capitalize = input => toString(input).replace(/^(\w)/, (m, chr) => chr.toLocaleUpperCase())
export const sort = (input, property = null) => {
  if (property === null) {
    return toIterable(input).sort()
  }
  return toIterable(input)
        .map(item => Promise.resolve(item != null ? item[property] : undefined)
            .then(key => ({key, item})))
        .then(array => array.sort((a, b) => (a.key > b.key) ? 1 : ((a.key === b.key) ? 0 : -1))
        .map(a => a.item))
}
export const map = (input, property = null) => {
  if (property === null) {
    return input
  }
  return toIterable(input)
    .map((e) => { if (e != null) return e[property] })
}
export const escape = input => toString(input).replace(HTML_ESCAPE_REGEXP, HTML_ESCAPE)
export const escape_once = input => toString(input).replace(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE)

/*
 * References:
 * - http://www.sitepoint.com/forums/showthread.php?218218-Javascript-Regex-making-Dot-match-new-lines
 */
export const strip_html = input => toString(input)
.replace(/<script[\s\S]*?<\/script>/g, '')
.replace(/<!--[\s\S]*?-->/g, '')
.replace(/<style[\s\S]*?<\/style>/g, '')
.replace(/<[^>]*?>/g, '')

export const strip_newlines = input => toString(input).replace(/\r?\n/g, '')

export const newline_to_br = input => toString(input).replace(/\n/g, '<br />\n')

/*
 * To be accurate, we might need to escape special chars in the string
 *
 * References
 * - http://stackoverflow.com/a/1144788/179691
 */
export const replace = (input, string, replacement = '') => toString(input).replace(new RegExp(string, 'g'), replacement)
export const replace_first = (input, string, replacement = '') => toString(input).replace(string, replacement)

export const remove = function (input, string) {
  return this.replace(input, string)
}
export const remove_first = function (input, string) {
  return this.replace_first(input, string)
}
export const truncate = (input, length = 50, truncateString = '...') => {
  input = toString(input)
  truncateString = toString(truncateString)
  length = toNumber(length)

  const l = ((length - truncateString.length) < 0) ? 0 : (length - truncateString.length)
  if (input.length > length) {
    return input.slice(0, l) + truncateString
  }
  return input
}
export const truncatewords = (input, words = 15, truncateString = '...') => {
  input = toString(input)
  words = Math.max(1, toNumber(words))
  const wordlist = input.split(' ')
  if (wordlist.length > words) {
    return wordlist.slice(0, words).join(' ') + truncateString
  }
  return input
}
export const split = (input, pattern) => {
  input = toString(input)
  if (!input) return
  return input.split(pattern)
}

// TODO!!!

export const flatten = input => toIterable(input).then(a => _flatten(a))
export const join = function (input, glue = ' ') {
  return this.flatten(input).then(a => a.join(glue))
}

// TODO!!!

/**
 * Get the first element of the passed-in array
 *
 * Example:
 *    {{ product.images | first | to_img }}
 */
export const first = input => {
  toIterable(input).first()
}

/**
 * Get the last element of the passed-in array
 *
 * Example:
 *    {{ product.images | last | to_img }}
 */
export const last = input => {
  toIterable(input).last()
}

export const plus = (input, operand) => toNumber(input) + toNumber(operand)
export const minus = (input, operand) => toNumber(input) - toNumber(operand)
export const times = (input, operand) => toNumber(input) * toNumber(operand)
export const dividedBy = (input, operand) => toNumber(input) / toNumber(operand)
export const divided_by = function (input, operand) {
  return this.dividedBy(input, operand)
}
export const round = (input, operand) => toNumber(input).toFixed(operand)
export const modulo = (input, operand) => toNumber(input) % toNumber(operand)
export const date = (input, format) => {
  input = toDate(input)
  if (input == null) {
    return ''
  } else if (toString(format).length === 0) {
    return input.toUTCString()
  } else {
    return strftime(format, input)
  }
}
export default (input, defaultValue = '') => {
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
