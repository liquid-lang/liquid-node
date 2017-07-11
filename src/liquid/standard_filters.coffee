strftime = require "strftime"
Iterable = require "./iterable"
{ flatten } = require "./helpers"

toNumber = (input) ->
  Number input

toObjectString = Object::toString
hasOwnProperty = Object::hasOwnProperty

isString = (input) ->
  toObjectString.call(input) is "[object String]"

isArray = (input) ->
  Array.isArray(input)

isArguments = (input) ->
  toObjectString(input) is "[object Arguments]"

# from jQuery
isNumber = (input) ->
  !isArray(input) and (input - parseFloat(input)) >= 0

toString = (input) ->
  unless input?
    ""
  else if isString input
    input
  else if typeof input.toString is "function"
    toString input.toString()
  else
    toObjectString.call input

toIterable = (input) ->
  Iterable.cast input

toDate = (input) ->
  return unless input?
  return input if input instanceof Date
  return new Date() if input is 'now'

  if isNumber input
    input = parseInt input
  else
    input = toString input
    return if input.length is 0
    input = Date.parse input

  new Date input if input?

# from underscore.js
has = (input, key) ->
  input? and hasOwnProperty.call(input, key)

# from underscore.js
isEmpty = (input) ->
  return true unless input?
  return input.length is 0 if isArray(input) or isString(input) or isArguments(input)
  (return false if has key, input) for key of input
  true

isBlank = (input) ->
  !(isNumber(input) or input is true) and isEmpty(input)

HTML_ESCAPE = (chr) ->
  switch chr
    when "&" then '&amp;'
    when ">" then '&gt;'
    when "<" then '&lt;'
    when '"' then '&quot;'
    when "'" then '&#39;'

HTML_ESCAPE_ONCE_REGEXP = /["><']|&(?!([a-zA-Z]+|(#\d+));)/g

HTML_ESCAPE_REGEXP = /([&><"'])/g


module.exports =

  size: (input) ->
    input?.length ? 0

  downcase: (input) ->
    toString(input).toLowerCase()

  upcase: (input) ->
    toString(input).toUpperCase()

  append: (input, suffix) ->
    toString(input) + toString(suffix)

  prepend: (input, prefix) ->
    toString(prefix) + toString(input)

  empty: (input) ->
    isEmpty(input)

  capitalize: (input) ->
    toString(input).replace /^([a-z])/, (m, chr) ->
      chr.toUpperCase()

  sort: (input, property) ->
    return toIterable(input).sort() unless property?

    toIterable(input)
    .map (item) ->
      Promise.resolve(item?[property])
      .then (key) ->
        { key, item }
    .then (array) ->
      array.sort (a, b) ->
        a.key > b.key ? 1 : (a.key is b.key ? 0 : -1)
      .map (a) -> a.item

  map: (input, property) ->
    return input unless property?

    toIterable(input)
    .map (e) ->
      e?[property]

  escape: (input) ->
    toString(input).replace HTML_ESCAPE_REGEXP, HTML_ESCAPE

  escape_once: (input) ->
    toString(input).replace HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE

  # References:
  # - http://www.sitepoint.com/forums/showthread.php?218218-Javascript-Regex-making-Dot-match-new-lines
  strip_html: (input) ->
    toString(input)
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<[^>]*?>/g, "")

  strip_newlines: (input) ->
    toString(input).replace(/\r?\n/g, "")

  newline_to_br: (input) ->
    toString(input).replace(/\n/g, "<br />\n")

  # To be accurate, we might need to escape special chars in the string
  #
  # References:
  # - http://stackoverflow.com/a/1144788/179691
  replace: (input, string, replacement = "") ->
    toString(input).replace(new RegExp(string, 'g'), replacement)

  replace_first: (input, string, replacement = "") ->
    toString(input).replace(string, replacement)

  remove: (input, string) ->
    @replace(input, string)

  remove_first: (input, string) ->
    @replace_first(input, string)

  truncate: (input, length = 50, truncateString = '...') ->
    input = toString(input)
    truncateString = toString(truncateString)

    length = toNumber(length)
    l = length - truncateString.length
    l = 0 if l < 0

    if input.length > length then input[...l] + truncateString else input

  truncatewords: (input, words = 15, truncateString = '...') ->
    input = toString(input)

    wordlist = input.split(" ")
    words = Math.max(1, toNumber(words))

    if wordlist.length > words
      wordlist.slice(0, words).join(" ") + truncateString
    else
      input

  split: (input, pattern) ->
    input = toString(input)
    return unless input
    input.split(pattern)

  ## TODO!!!

  flatten: (input) ->
    toIterable(input).toArray().then (a) ->
      flatten a

  join: (input, glue = ' ') ->
    @flatten(input).then (a) ->
      a.join(glue)

  ## TODO!!!


  # Get the first element of the passed in array
  #
  # Example:
  #    {{ product.images | first | to_img }}
  #
  first: (input) ->
    toIterable(input).first()

  # Get the last element of the passed in array
  #
  # Example:
  #    {{ product.images | last | to_img }}
  #
  last: (input) ->
    toIterable(input).last()

  plus: (input, operand) ->
    toNumber(input) + toNumber(operand)

  minus: (input, operand) ->
    toNumber(input) - toNumber(operand)

  times: (input, operand) ->
    toNumber(input) * toNumber(operand)

  dividedBy: (input, operand) ->
    toNumber(input) / toNumber(operand)

  divided_by: (input, operand) ->
    @dividedBy(input, operand)

  round: (input, operand) ->
    toNumber(input).toFixed(operand)

  modulo: (input, operand) ->
    toNumber(input) % toNumber(operand)

  date: (input, format) ->
    input = toDate input

    unless input?
      ""
    else if toString(format).length is 0
      input.toUTCString()
    else
      strftime format, input

  default: (input, defaultValue) ->
    defaultValue = '' if arguments.length < 2
    blank = input?.isBlank?() ? isBlank(input)
    if blank then defaultValue else input
