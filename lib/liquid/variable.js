const slice = [].slice
const Liquid = require('../liquid')
const PromiseReduce = require('../promise_reduce')

module.exports = (function () {
  var FilterArgParser, FilterListFragment, VariableNameFragment

  Variable.FilterParser = RegExp('(?:' + Liquid.FilterSeparator.source + '|(?:\\s*(?!(?:' + Liquid.FilterSeparator.source + '))(?:' + Liquid.QuotedFragment.source + '|\\S+)\\s*)+)')

  VariableNameFragment = RegExp('\\s*(' + Liquid.QuotedFragment.source + ')(.*)')

  FilterListFragment = RegExp(Liquid.FilterSeparator.source + '\\s*(.*)')

  FilterArgParser = RegExp('(?:' + Liquid.FilterArgumentSeparator.source + '|' + Liquid.ArgumentSeparator.source + ')\\s*(' + Liquid.QuotedFragment.source + ')')

  function Variable (markup) {
    var filters, match
    this.markup = markup
    this.name = null
    this.filters = []
    match = VariableNameFragment.exec(this.markup)
    if (!match) {
      return
    }
    this.name = match[1]
    match = FilterListFragment.exec(match[2])
    if (!match) {
      return
    }
    filters = Liquid.Helpers.scan(match[1], Liquid.Variable.FilterParser)
    filters.forEach((function (_this) {
      return function (filter) {
        var filterArgs, filterName
        match = /\s*(\w+)/.exec(filter)
        if (!match) {
          return
        }
        filterName = match[1]
        filterArgs = Liquid.Helpers.scan(filter, FilterArgParser)
        filterArgs = Liquid.Helpers.flatten(filterArgs)
        return _this.filters.push([filterName, filterArgs])
      }
    })(this))
  }

  Variable.prototype.render = function (context) {
    var filtered, reducer, value
    if (this.name == null) {
      return ''
    }
    reducer = (function (_this) {
      return function (input, filter) {
        var filterArgs
        filterArgs = filter[1].map(function (a) {
          return context.get(a)
        })
        return Promise.all([input].concat(slice.call(filterArgs))).then(function (results) {
          input = results.shift()
          try {
            return context.invoke.apply(context, [filter[0], input].concat(slice.call(results)))
          } catch (error) {
            if (!(error instanceof Liquid.FilterNotFound)) {
              throw error
            }
            throw new Liquid.FilterNotFound("Error - filter '" + filter[0] + "' in '" + _this.markup + "' could not be found.")
          }
        })
      }
    })(this)
    value = Promise.resolve(context.get(this.name))
    switch (this.filters.length) {
      case 0:
        filtered = value
        break
      case 1:
        filtered = reducer(value, this.filters[0])
        break
      default:
        filtered = PromiseReduce(this.filters, reducer, value)
    }
    return filtered.then(function (f) {
      if (!(f instanceof Liquid.Drop)) {
        return f
      }
      f.context = context
      return f.toString()
    })['catch'](function (e) {
      return context.handleError(e)
    })
  }

  return Variable
})()
