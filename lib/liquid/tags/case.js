const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')

const SyntaxHelp = "Syntax Error in tag 'case' - Valid syntax: case [expression]"
const Syntax = RegExp('(' + Liquid.QuotedFragment.source + ')')
const WhenSyntax = RegExp('(' + Liquid.QuotedFragment.source + ')(?:(?:\\s+or\\s+|\\s*\\,\\s*)(' + Liquid.QuotedFragment.source + '))?')

module.exports = class Case extends Liquid.Block {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    this.blocks = []
  }

  unknownTag (tag, markup) {
    if (tag === 'when' || tag === 'else') {
      return this.pushBlock(tag, markup)
    } else {
      return super.unknownTag(tag, markup)
    }
  }

  pushBlock (tag, markup) {
    if (tag === 'else') {
      const block = new Liquid.ElseCondition()
      this.blocks.push(block)
      this.nodelist = block.attach([])
      return this.nodelist
    }

    const expressions = Liquid.Helpers.scan(markup, WhenSyntax)
    const nodelist = []
    const ref = expressions[0]
    const results = []

    for (const value of ref) {
      if (value) {
        const block = new Liquid.Condition(this.markup, '==', value)
        this.blocks.push(block)
        results.push(this.nodelist = block.attach(nodelist))
      } else {
        results.push(void 0)
      }
    }

    return results
  }

  async render (context) {
    const block = await PromiseReduce(this.blocks, async (chosenBlock, block) => {
      if (chosenBlock != null) return chosenBlock
      const ok = await block.evaluate(context)
      if (ok) return block
    }, null)

    return context.stack(() => {
      return block != null
        ? this.renderAll(block.attachment, context)
        : ''
    })
  }
}
