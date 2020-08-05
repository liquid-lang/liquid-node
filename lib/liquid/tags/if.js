const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')

const SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]"
const Syntax = RegExp('(' + Liquid.QuotedFragment.source + ')\\s*([=!<>a-z_]+)?\\s*(' + Liquid.QuotedFragment.source + ')?')
const ExpressionsAndOperators = RegExp('(?:\\b(?:\\s?and\\s?|\\s?or\\s?)\\b|(?:\\s*(?!\\b(?:\\s?and\\s?|\\s?or\\s?)\\b)(?:' + Liquid.QuotedFragment.source + '|\\S+)\\s*)+)')

module.exports = class If extends Liquid.Block {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    this.blocks = []
    this.pushBlock('if', markup)
  }

  unknownTag (tag, markup) {
    if (tag === 'elsif' || tag === 'else') {
      return this.pushBlock(tag, markup)
    } else {
      return super.unknownTag(tag, markup)
    }
  }

  defineBlock (tag, markup) {
    if (tag === 'else') {
      return new Liquid.ElseCondition()
    }

    const expressions = Liquid.Helpers
      .scan(markup, ExpressionsAndOperators)
      .reverse()

    const match = Syntax.exec(expressions.shift())
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    let condition = new Liquid.Condition(...match.slice(1, 4))

    while (expressions.length > 0) {
      const operator = String(expressions.shift()).trim()
      const newMatch = Syntax.exec(expressions.shift())
      if (!newMatch) {
        throw new SyntaxError(SyntaxHelp)
      }

      const newCondition = new Liquid.Condition(...newMatch.slice(1, 4))
      newCondition[operator].call(newCondition, condition) // eslint-disable-line
      condition = newCondition
    }

    return condition
  }

  pushBlock (tag, markup) {
    const block = this.defineBlock(tag, markup)
    this.blocks.push(block)
    this.nodelist = block.attach([])
  }

  async render (context) {
    const block = await PromiseReduce(this.blocks, async (chosenBlock, block) => {
      if (chosenBlock != null) return chosenBlock
      let ok = await block.evaluate(context)
      if (block.negate) ok = !ok
      if (ok) return block
    }, null)

    return context.stack(async () => {
      if (block != null) {
        return this.renderAll(block.attachment, context)
      } else {
        return ''
      }
    })
  }
}
