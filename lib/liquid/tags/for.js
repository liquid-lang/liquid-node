const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')
const Iterable = require('../iterable')

const SyntaxHelp = "Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]"
const Syntax = RegExp('(\\w+)\\s+in\\s+((?:' + Liquid.QuotedFragment.source + ')+)\\s*(reversed)?')

module.exports = class For extends Liquid.Block {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    this.variableName = match[1]
    this.collectionName = match[2]
    this.registerName = match[1] + '=' + match[2]
    this.reversed = match[3]
    this.attributes = {}
    this.nodelist = this.forBlock = []

    Liquid.Helpers.scan(markup, Liquid.TagAttributes).forEach(attr => {
      this.attributes[attr[0]] = attr[1]
    })
  }

  unknownTag (tag, markup) {
    if (tag !== 'else') {
      return super.unknownTag(tag, markup)
    }
    this.nodelist = this.elseBlock = []
    return this.nodelist
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

    const ref = Iterable.cast(collection)
    return ref.slice.apply(ref, args)
  }

  async render (context) {
    if (!context.registers.for) context.registers.for = {}
    let collection = await context.get(this.collectionName)

    if (collection != null ? collection.forEach : void 0) {

    } else if (collection instanceof Object) {
      const results = []

      for (const key in collection) {
        if (!Object.prototype.hasOwnProperty.call(collection, key)) {
          continue
        }

        const v = collection[key]
        results.push([key, v])
      }

      collection = results
    } else {
      return this.renderElse(context)
    }

    const from = this.attributes.offset === 'continue' ? Number(context.registers.for[this.registerName]) || 0 : Number(this.attributes.offset) || 0
    const limit = this.attributes.limit
    const to = limit ? Number(limit) + from : null

    const segment = await this.sliceCollection(collection, from, to)
    if (segment.length === 0) {
      return this.renderElse(context)
    }

    if (this.reversed) {
      segment.reverse()
    }

    const length = segment.length
    context.registers.for[this.registerName] = from + segment.length
    return context.stack(() => {
      return PromiseReduce(segment, async (output, item, index) => {
        context.set(this.variableName, item)
        context.set('forloop', {
          name: this.registerName,
          length: length,
          index: index + 1,
          index0: index,
          rindex: length - index,
          rindex0: length - index - 1,
          first: index === 0,
          last: index === length - 1
        })

        try {
          const rendered = await this.renderAll(this.forBlock, context)
          output.push(rendered)
        } catch (err) {
          output.push(context.handleError(err))
        }

        return output
      }, [])
    })
  }
}
