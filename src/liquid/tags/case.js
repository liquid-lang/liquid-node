import Promise from 'any-promise'
import PromiseReduce from '../../promise_reduce'
import Block from '../block'
import { QuotedFragment } from '../regexps'
import { SyntaxError } from '../errors'
import ElseCondition from '../else_condition'
import {scan} from '../helpers'
import Condition from '../condition'

const SyntaxHelp = "Syntax Error in tag 'case' - Valid syntax: case [expression]"

const Syntax = RegExp(`(${QuotedFragment.source})`)
const WhenSyntax = RegExp(`(${QuotedFragment.source})(?:(?:\\s+or\\s+|\\s*\\,\\s*)(${QuotedFragment.source}))?`)

class Case extends Block {
  blocks = []
  markup = ''
  constructor (template, tagName, markup) {
    super(template)
    const match = Syntax.exec(markup)
    if (!match) {
      throw new SyntaxError(SyntaxHelp)
    }
    this.markup = markup
  }
  unknownTag (tag, markup) {
    if (['when', 'else'].includes(tag)) {
      return this.pushBlock(tag, markup)
    }
    return super.unknownTag(tag, markup)
  }
  render (context) {
    const self = this
    return context.stack(() => {
      return PromiseReduce(this.blocks, (chosenBlock, block) => {
        if (chosenBlock != null) {
          return chosenBlock
        }
        return Promise.resolve()
          .then(() => block.evaluate(context))
          .then(ok => ok && block)
      }, null)
        .then((block) => {
          if (block != null) {
            return self.renderAll(block.attachment, context)
          }
          return ''
        })
    })
  }
  // private
  pushBlock (tag, markup) {
    let block = null
    if (tag === 'else') {
      block = new ElseCondition()
      this.blocks.push(block)
      this.nodelist = block.attach([])
    } else {
      const expressions = scan(markup, WhenSyntax)
      const nodelist = []
      const self = this
      expressions[0].forEach((value) => {
        if (value) {
          block = new Condition(self.markup, '==', value)
          self.blocks.push(block)
          self.nodelist = block.attach(nodelist)
        }
      })
    }
  }
}
export default Case
