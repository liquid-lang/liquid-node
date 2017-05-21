import Tag from '../tag'
import {SyntaxError} from '../errors'
import {VariableSignature} from '../regexps'
import Variable from '../variable'
class Assign extends Tag {
  static get SyntaxHelp () {
    return "Syntax Error in 'assign' - Valid syntax: assign [var] = [source]"
  }
  static get Syntax () {
    return RegExp(`((?:${VariableSignature.source})+)\\s*=\\s*(.*)\\s*`)
  }
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Assign.Syntax.exec(markup)
    if (match) {
      this.to = match[1]
      this.from = new Variable(match[2])
    } else {
      throw new SyntaxError(Assign.SyntaxHelp)
    }
  }
  render (context) {
    context.lastScope()[this.to] = this.from.render(context)
    return super.render(context)
  }
}

export default Assign
