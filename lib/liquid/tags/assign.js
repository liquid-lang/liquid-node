const Liquid = require('../../liquid')

const SyntaxHelp = "Syntax Error in 'assign' - Valid syntax: assign [var] = [source]"
const Syntax = RegExp('((?:' + Liquid.VariableSignature.source + ')+)\\s*=\\s*(.*)\\s*')

module.exports = class Assign extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (match) {
      this.to = match[1]
      this.from = new Liquid.Variable(match[2])
    } else {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
  }

  async render (context) {
    context.lastScope()[this.to] = this.from.render(context)
    return super.render.call(this, context)
  }
}
