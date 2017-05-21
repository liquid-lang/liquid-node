// @flow
import { ArgumentSeparator, FilterArgumentSeparator, FilterSeparator, QuotedFragment } from './regexps'
import {flatten, scan} from './helpers'
import Context from './context'
import Drop from './drop'
import {FilterNotFound} from './errors'
import PromiseReduce from '../promise_reduce'

const FilterListFragment = RegExp(`${FilterSeparator.source}\\s*(.*)`)
const FilterArgParser = RegExp(`(?:${FilterArgumentSeparator.source}|${ArgumentSeparator.source})\\s*(${QuotedFragment.source})`)

class Variable {
  static FilterParser = RegExp(`(?:${FilterSeparator.source}|(?:\\s*(?!(?:${FilterSeparator.source}))(?:${QuotedFragment.source}|\\S+)\\s*)+)`)
  filters: Map<string, any> = new Map()
  name: string = ''
  markup: string
  constructor (markup: string) {
    this.markup = markup
    let match = Variable.FilterParser.exec(this.markup)
    if (!match) return
    if (match.length === 1) {
      this.name = match[0]
    } else {
      this.name = match[1]
    }
    this.name = this.name.replace(/\s*/g, '')
    match = FilterListFragment.exec(match[2])
    if (!match) return
    const self = this
    const filters = scan(match[1], Variable.FilterParser)
    filters.forEach(filter => {
      match = /\s*(\w+)/.exec(filter)
      if (!match) return
      const filterName = match[1]
      const filterArgs = flatten(scan(filter, FilterArgParser))
      return self.filters.set(filterName, filterArgs)
    })
  }
  render (context: Context) {
    if (this.name === '') {
      return ''
    }
    const self = this
    const reducer = function (input, filter) {
      const filterArgs = filter[1].map(a => context.get(a))
      return Promise.all([input].concat(...filterArgs)).then(results => {
        input = results.shift()
        try {
          return context.invoke(...[filter[0], input].concat(...results))
        } catch (e) {
          if (!(e instanceof FilterNotFound)) {
            throw e
          }
        }
        let filtered
        const value = Promise.resolve(context.get(self.name))
        switch (self.filters.size) {
          case 0:
            filtered = value
            break
          case 1:
            filtered = reducer(value, Array.from(self.filters.values())[0])
            break
          default:
            filtered = PromiseReduce(Array.from(self.filters.values()), reducer, value)
        }
        return filtered.then(f => {
          if (!(f instanceof Drop)) return f
          f.context = context
          return f.toString()
        }).catch(e => context.handleError(e))
      })
    }
  }
}

export default Variable
