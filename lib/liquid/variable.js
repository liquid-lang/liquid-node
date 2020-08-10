const Liquid = require('../liquid')
const PromiseReduce = require('../promise_reduce')

const VariableNameFragment = RegExp('\\s*(' + Liquid.QuotedFragment.source + ')(.*)')
const FilterListFragment = RegExp(Liquid.FilterSeparator.source + '\\s*(.*)')
const FilterArgParser = RegExp('(?:' + Liquid.FilterArgumentSeparator.source + '|' + Liquid.ArgumentSeparator.source + ')\\s*(' + Liquid.QuotedFragment.source + ')')
const FilterParser = RegExp('(?:' + Liquid.FilterSeparator.source + '|(?:\\s*(?!(?:' + Liquid.FilterSeparator.source + '))(?:' + Liquid.QuotedFragment.source + '|\\S+)\\s*)+)')

class Variable {
  constructor (markup) {
    this.markup = markup
    this.name = null
    this.filters = []

    const match = VariableNameFragment.exec(this.markup)
    if (!match) return

    this.name = match[1]

    const secondMatch = FilterListFragment.exec(match[2])
    if (!secondMatch) return

    const filters = Liquid.Helpers.scan(secondMatch[1], Liquid.Variable.FilterParser)

    filters.forEach(filter => {
      const filterMatch = /\s*(\w+)/.exec(filter)
      if (!filterMatch) return
      const filterName = filterMatch[1]
      const filterArgs = Liquid.Helpers.scan(filter, FilterArgParser)
      const flattenedArgs = Liquid.Helpers.flatten(filterArgs)
      return this.filters.push([filterName, flattenedArgs])
    })
  }

  async render (context) {
    if (this.name == null) {
      return ''
    }

    const reducer = async (input, filter) => {
      const filterArgs = filter[1].map(a => context.get(a))
      const results = await Promise.all([input].concat(...filterArgs))
      input = results.shift()
      try {
        return context
          .invoke
          .apply(context, [filter[0], input].concat(...results))
      } catch (error) {
        if (!(error instanceof Liquid.FilterNotFound)) {
          throw error
        }
        throw new Liquid.FilterNotFound(`Error - filter '${filter[0]}' in '${this.markup}' could not be found.`)
      }
    }

    const value = await context.get(this.name)

    let filtered
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

    try {
      const f = await filtered
      if (!(f instanceof Liquid.Drop)) return f
      f.context = context
      return f.toString()
    } catch (err) {
      return context.handleError(err)
    }
  }
}

Variable.FilterParser = FilterParser

module.exports = Variable
