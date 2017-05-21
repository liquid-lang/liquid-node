// @flow
import Block from '../block'
import {SyntaxError} from '../errors'
import * as Helpers from '../helpers'

const Syntax = /(\w+)/
const SyntaxHelp = "Syntax Error in 'capture' - Valid syntax: capture [var]"

class Capture extends Block {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (match) {
      this.to = match[1]
    } else {
      throw new SyntaxError(SyntaxHelp)
    }
  }
  render (context) {
    const self = this
    super.render(context).then((chunks) => {
      const output = Helpers.toFlatString(chunks)
      context.lastScope()[self.to] = output
      return ''
    })
  }
}
export default Capture
