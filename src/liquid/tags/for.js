import Promise from 'any-promise'
import PromiseReduce from '../../promise_reduce'
import Iterable from '../iterable'
import Block from '../block'
import {QuotedFragment, TagAttributes} from '../regexps'
import {SyntaxError} from '../errors'
import * as Helpers from '../helpers'

const SyntaxHelp = "Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]"

const Syntax = RegExp(`(\\w+)\\s+in\\s+((?:${QuotedFragment.source})+)\\s*(reversed)?`)
class For extends Block {
  constructor (template, tagName, markup) {
    const match = Syntax.exec(markup)
    super(template, tagName, markup)
    const self = this
    if (match) {
      this.variableName = match[1]
      this.collectionName = match[2]
      this.registerName = `${match[1]}=${match[2]}`
      this.reversed = match[3]
      this.attributes = {}
      Helpers.scan(markup, TagAttributes).forEach(attr => {
        self.attributes[attr[0]] = attr[1]
      })
    } else {
      throw new SyntaxError(SyntaxHelp)
    }
    this.forBlock = []
    this.nodelist = this.forBlock
  }
  render (context) {
    if (context.registers.for == null) {
      context.registers.for = {}
    }
    const self = this
    return Promise.resolve(context.get(this.collectionName)).then(collection => collection.filter(itm => itm == null)).then((collection) => {
      if (collection.forEach) {
        // pass
      } else if (collection instanceof Object) {
        const tmp = new Map()
        for (const key in collection) {
          if (collection.hasOwnProperty(key)) {
            const value = collection[key]
            tmp.set(key, value)
          }
          collection = Array.from(tmp.entries())
        }
      } else {
        return self.renderElse(context)
      }
      let from = Number(self.attributes.offset) || 0
      if (self.attributes.offset === 'continue') {
        from = Number(context.registers['for'][self.registerName]) || 0
      }
      const limit = self.attributes.limit
      let to = null
      if (limit) {
        to = Number(limit) + from
      }

      self.sliceCollection(collection, from, to).then((segment) => {
        if (segment.length === 0) {
          return self.renderElse(context)
        }
        if (self.reversed) {
          segment.reverse()
        }
        const length = segment.length

        // Store our progress through the collection for the continue flag
        context.registers['for'][self.registerName] = from + segment.length
        return context.stack(() => {
          return PromiseReduce(segment, (output, item, index) => {
            context.set(self.variableName, item)
            context.set('forloop', {
              name: self.registerName,
              length,
              index: index + 1,
              index0: index,
              rindex: length - index,
              rindex0: length - index - 1,
              first: index === 0,
              last: index === length - 1
            })
            return Promise.resolve()
            .then(() => self.renderAll(self.forBlock, context))
            .then((rendered) => {
              output.push(rendered)
              return output
            })
            .catch((e) => {
              output.push(context.handleError(e))
              return output
            })
          }, [])
        })
      })
    })
  }
  renderElse (context) {
    if (this.elseBlock) {
      return this.renderAll(this.elseBlock, context)
    } else {
      return ''
    }
  }
  sliceCollection (collection, from, to) {
    const args = [from]
    if (to != null) {
      args.push(to)
    }
    return Iterable.cast(collection).slice(...args)
  }
  unknownTag (tag, markup) {
    if (tag !== 'else') {
      return super.unknownTag(tag, markup)
    }
    this.elseBlock = []
    this.nodelist = this.elseBlock
  }
}

export default For
