// @flow
/* eslint-disable camelcase */
import strftime from 'strftime';
import isEmpty from 'lodash.isempty';
import Iterable from './iterable';
import { flatten as _flatten } from './helpers';

const toNumber = (input: any) => Number(input);
const isString = (input: any) => Object.prototype.toString.call(input) === '[object String]';
// const isArray = (input: any) => Array.isArray(input);

const isNumber = (input: any) => !Number.isNaN(input);
// from jQuery
// const isNumber = (input: any) => !isArray(input) && (input - parseFloat(input)) >= 0;

const toString = (input: any): string => {
  if (input == null) {
    return '';
  }
  if (isString(input)) {
    return input;
  }
  if (typeof input.toString === 'function') {
    return toString(input.toString());
  }
  return Object.prototype.toString.call(input);
};
const toIterable = (input: any) => Iterable.cast(input);
const toDate = (input: any) => {
  // if (input == null) {
  //   return null;
  // }
  if (input instanceof Date) {
    return input;
  }
  if (input === 'now') {
    return new Date();
  }
  let num = null;
  if (isNumber(input)) {
    num = parseInt(input, 10);
  } else {
    num = toString(input);
    if (num.length === 0) return null;
    num = Date.parse(num);
  }
  if (num) {
    return new Date(num);
  }
  return null;
};

const isBlank = (input: any) => !(isNumber(input) || input === true) && isEmpty(input);

const HTML_ESCAPE = (chr: string) => {
  switch (chr) {
    case '&':
      return '&amp;';
    case '>':
      return '&gt;';
    case '<':
      return '&lt;';
    case '"':
      return '&quot;';
    case '\'':
      return '&#39;';
    default:
      return chr;
  }
};


const HTML_ESCAPE_ONCE_REGEXP = /["><']|&(?!([a-zA-Z]+|(#\d+));)/g;

const HTML_ESCAPE_REGEXP = /([&><"'])/g;

// / ////////////////////////////////////////////////////////////////////////////
//                                Exports Below                               //
// / ////////////////////////////////////////////////////////////////////////////

const STANDARD_FILTERS: Map<string, Function> = new Map();

STANDARD_FILTERS.set('size', (input: any) => {
  if (input == null) return 0;
  if (input.length === undefined) return 0;
  return input.length;
});
STANDARD_FILTERS.set('downcase', (input: string) => toString(input).toLocaleLowerCase());
STANDARD_FILTERS.set('upcase', (input: string) => toString(input).toLocaleUpperCase());
STANDARD_FILTERS.set('append', (input: string, suffix: string) => `${toString(input)}${toString(suffix)}`);
STANDARD_FILTERS.set('prepend', (input: string, prefix: string) => `${toString(prefix)}${toString(input)}`);
STANDARD_FILTERS.set('empty', (input: any) => isEmpty(input));
STANDARD_FILTERS.set('capitalize', (input: string) => toString(input).replace(/^(\w)/, (m: string, chr: string) => chr.toLocaleUpperCase()));
STANDARD_FILTERS.set('sort', async (input: any[], property: any = null) => {
  if (property === null) {
    return (await toIterable(input)).sort();
  }
  return (await toIterable(input)).filter((item: any) => item)
          .map((item: any) => new Promise(resolve => resolve(item[property]))
          .then(key => ({ key, item })))
          .then((array: {key: number, item: any}[]) => array.sort((a, b) => {
            if (a.key > b.key) {
              return 1;
            }
            if (a.key === b.key) {
              return 0;
            }
            return -1;
          })
          .map(a => a.item));
});
STANDARD_FILTERS.set('map', async (input: object, property: string = null) => {
  if (property === null) {
    return input;
  }
  return (await toIterable(input)).filter((e: any) => e != null)
  .map((e: any) => e[property]);
});
STANDARD_FILTERS.set('escape', (input: string) => toString(input)
.replace(HTML_ESCAPE_REGEXP, HTML_ESCAPE));
STANDARD_FILTERS.set('escape_once', (input: string) => toString(input)
.replace(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE));

/*
* References:
* http://www.sitepoint.com/forums/showthread.php?218218-Javascript-Regex-making-Dot-match-new-lines
*/
STANDARD_FILTERS.set('strip_html', (input: string) => toString(input)
.replace(/<script[\s\S]*?<\/script>/g, '')
.replace(/<!--[\s\S]*?-->/g, '')
.replace(/<style[\s\S]*?<\/style>/g, '')
.replace(/<[^>]*?>/g, ''),
);
STANDARD_FILTERS.set('strip_newlines', (input: string) => toString(input).replace(/\r?\n/g, ''));
STANDARD_FILTERS.set('newline_to_br', (input: string) => toString(input).replace(/\n/g, '<br />\n'));

/*
* To be accurate, we might need to escape special chars in the string
*
* References
* - http://stackoverflow.com/a/1144788/179691
*/
STANDARD_FILTERS.set('replace', (input: string, string: string, replacement = '') => toString(input)
.replace(new RegExp(string, 'g'), replacement));
STANDARD_FILTERS.set('replace_first', (input: string, string: string, replacement = '') => toString(input).replace(string, replacement));

STANDARD_FILTERS.set('remove', (input: string, string: string) => STANDARD_FILTERS.get('replace')(input, string));
STANDARD_FILTERS.set('remove_first', (input: string, string: string) => STANDARD_FILTERS.get('replace_first')(input, string));

STANDARD_FILTERS.set('truncate', (input: string, length = 50, truncateString = '...') => {
  const output = toString(input);
  const trunc = toString(truncateString);
  const len = toNumber(length);

  const l = ((len - trunc.length) < 0) ? 0 : (len - trunc.length);
  if (output.length > len) {
    return output.slice(0, l) + trunc;
  }
  return output;
});
STANDARD_FILTERS.set('truncatewords', (input: string, words = 15, truncateString = '...') => {
  const output = toString(input);
  const wordCount = Math.max(1, toNumber(words));
  const wordlist = output.split(' ');
  if (wordlist.length > wordCount) {
    return wordlist.slice(0, wordCount).join(' ') + truncateString;
  }
  return output;
});
STANDARD_FILTERS.set('split', (input: string, pattern: string | RegExp) => {
  if (!toString(input)) return '';
  return toString(input).split(pattern);
});

// TODO!!!

STANDARD_FILTERS.set('flatten', (input: any) => Promise.resolve(toIterable(input))
.then(a => _flatten(a)));
STANDARD_FILTERS.set('join', (input: any, glue = ' ') => STANDARD_FILTERS.get('flatten')(input)
.then((a: string[]) => a.join(glue)));

// TODO!!!

/**
* Get the first element of the passed-in array
*
* Example:
*    {{ product.images | first | to_img }}
*/
STANDARD_FILTERS.set('first', async (input: any) => (await toIterable(input)).first());

/**
* Get the last element of the passed-in array
*
* Example:
*    {{ product.images | last | to_img }}
*/
STANDARD_FILTERS.set('last', async (input: any) => (await toIterable(input)).last());

STANDARD_FILTERS.set('plus', (input: number, operand: number) => toNumber(input) + toNumber(operand));
STANDARD_FILTERS.set('minus', (input: number, operand: number) => toNumber(input) - toNumber(operand));
STANDARD_FILTERS.set('times', (input: number, operand: number) => toNumber(input) * toNumber(operand));
STANDARD_FILTERS.set('dividedBy', (input: number, operand: number) => toNumber(input) / toNumber(operand));
STANDARD_FILTERS.set('divided_by', (input: number, operand: number) => STANDARD_FILTERS.get('dividedBy')(input, operand));
STANDARD_FILTERS.set('round', (input: number, operand: number) => toNumber(input).toFixed(operand));
STANDARD_FILTERS.set('modulo', (input: number, operand: number) => toNumber(input) % toNumber(operand));
STANDARD_FILTERS.set('date', (date: Date, format: string) => {
  const input = toDate(date);
  if (input == null) {
    return '';
  }
  if (toString(format).length === 0) {
    return input.toUTCString();
  }
  return strftime(format, input);
});
STANDARD_FILTERS.set('default', (input: any, defaultValue = '') => {
  if (input == null) {
    return defaultValue;
  }

  if (typeof input.isBlank === 'function') {
    if (input.isBlank()) {
      return defaultValue;
    }
    return input;
  }
  if (isBlank(input)) {
    return defaultValue;
  }
  return input;
});

export default STANDARD_FILTERS;
