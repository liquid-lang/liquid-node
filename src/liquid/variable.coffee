Liquid = require("../liquid")
PromiseReduce = require "../promise_reduce"

# Holds variables. Variables are only loaded "just in time"
# and are not evaluated as part of the render stage
#
#   {{ monkey }}
#   {{ user.name }}
#
# Variables can be combined with filters:
#
#   {{ user | link }}
#
module.exports = class Variable
  @FilterParser = ///(?:#{Liquid.FilterSeparator.source}|(?:\s*(?!(?:#{Liquid.FilterSeparator.source}))(?:#{Liquid.QuotedFragment.source}|\S+)\s*)+)///
  VariableNameFragment = ///\s*(#{Liquid.QuotedFragment.source})(.*)///
  FilterListFragment = ///#{Liquid.FilterSeparator.source}\s*(.*)///
  FilterArgParser = ///(?:#{Liquid.FilterArgumentSeparator.source}|#{Liquid.ArgumentSeparator.source})\s*(#{Liquid.QuotedFragment.source})///

  constructor: (@markup) ->
    @name = null
    @filters = []

    match = VariableNameFragment.exec @markup
    return unless match

    @name = match[1]

    match = FilterListFragment.exec match[2]
    return unless match

    filters = Liquid.Helpers.scan match[1], Liquid.Variable.FilterParser
    filters.forEach (filter) =>
      match = /\s*(\w+)/.exec filter
      return unless match
      filterName = match[1]
      filterArgs = Liquid.Helpers.scan filter, FilterArgParser
      filterArgs = Liquid.Helpers.flatten filterArgs
      @filters.push [filterName, filterArgs]

  render: (context) ->
    return '' unless @name?

    reducer = (input, filter) =>
      filterArgs = filter[1].map (a) -> context.get a

      Promise.all([input, filterArgs...]).then (results) =>
        input = results.shift()
        try
          context.invoke filter[0], input, results...
        catch e
          throw e unless e instanceof Liquid.FilterNotFound
          throw new Liquid.FilterNotFound("Error - filter '#{filter[0]}' in '#{@markup}' could not be found.")

    value = Promise.resolve context.get(@name)

    switch @filters.length
      when 0
        filtered = value
      when 1
        # Special case since Array#reduce doesn't call
        # reducer if element has only a single element.
        filtered = reducer value, @filters[0]
      else
        filtered = PromiseReduce @filters, reducer, value

    filtered.then (f) ->
      return f unless f instanceof Liquid.Drop
      f.context = context
      f.toString()
    .catch (e) ->
      context.handleError e
