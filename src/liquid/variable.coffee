Liquid = require("../liquid_base")
_ = require("underscore")._
futures = require "futures"

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

  constructor: (@markup) ->
    @name = null
    @filters = []

    if match = ///\s*(#{Liquid.QuotedFragment.source})(.*)///.exec(@markup)
      @name = match[1]
      if match2 = ///#{Liquid.FilterSeparator.source}\s*(.*)///.exec(match[2])
        filters = Liquid.Helpers.scan(match2[1], Liquid.Variable.FilterParser)
        _(filters).forEach (f) =>
          if match3 = /\s*(\w+)/.exec(f)
            filtername = match3[1]
            filterargs = Liquid.Helpers.scan(f, ///(?:#{Liquid.FilterArgumentSeparator.source}|#{Liquid.ArgumentSeparator.source})\s*(#{Liquid.QuotedFragment.source})///)
            filterargs = _(filterargs).flatten()
            @filters.push [filtername, filterargs]

  render: (context) ->
    return '' unless @name?

    mapper = (output, filter) =>
      filterargs = _(filter[1]).map (a) =>
        context.get(a)

      dependencies = [output, filterargs...]
      waitingFor = _(dependencies).select (o) -> o?.isFuture?

      execute = =>
        try
          context.invoke(filter[0], output, filterargs...)
        catch e
          throw e unless e instanceof Liquid.FilterNotFound
          throw new Liquid.FilterNotFound("Error - filter '#{filter[0]}' in '#{@markup}' could not be found.")

      if waitingFor.length > 0
        counter = waitingFor.length
        result = futures.future()

        dependencies.forEach (k, i) =>
          return unless k?.isFuture?

          k.when (err, r) =>
            if i == 0
              output = r
            else
              filterargs[i-1] = r

            counter -= 1
            if counter == 0
              Liquid.Helpers.unfuture execute(), =>
                result.deliver arguments...

        result
      else
        execute()

    Liquid.Helpers.unfuture context.get(@name), (err, value) =>
      Liquid.Helpers.unfuture _(@filters).inject(mapper, value), (err, value) =>
        if value instanceof Liquid.Drop
          if typeof value.toString == "function"
            value.context = context
            return value.toString()
          else
            return "Liquid.Drop"
        else
          value
