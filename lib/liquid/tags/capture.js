const Liquid = require('../../liquid')

const Syntax = /(\w+)/
const SyntaxHelp = "Syntax Error in 'capture' - Valid syntax: capture [var]"

module.exports = class Capture extends Liquid.Block {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (match) {
      this.to = match[1]
    } else {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
  }

  async render (context) {
    const chunks = await super.render(context)
    const output = Liquid.Helpers.toFlatString(chunks)
    context.lastScope()[this.to] = output
    return ''
  }
}
