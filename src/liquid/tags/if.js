import PromiseReduce from '../../promise_reduce'
import {QuotedFragment} from '../regexps'
import {Block} from '../block'

export class If extends Block {
  static SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]"
  static Syntax = RegExp('(' + QuotedFragment.source + ')\\s*([=!<>a-z_]+)?\\s*(' + QuotedFragment.source + ')?')
  static ExpressionsAndOperators = RegExp('(?:\\b(?:\\s?and\\s?|\\s?or\\s?)\\b|(?:\\s*(?!\\b(?:\\s?and\\s?|\\s?or\\s?)\\b)(?:' + QuotedFragment.source + '|\\S+)\\s*)+)')

  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    this.blocks = []
    this.pushBlock('if', markup)
  }
  unknownTag (tag, markup) {
    if (['elsif', 'else'].includes(tag)) {
      return this.pushBlock(tag, markup)
    }
    return super.unknownTag(tag, markup)
  }
  render (context) {
    const self = this
    return context
        .stack(() => PromiseReduce(self.blocks,
          (chosenBlock, block) => {
            if (chosenBlock != null) {
              return chosenBlock
            }
            return Promise.resolve()
                    .then(() => block.evaluate(context))
                    .then(ok => {
                      if (block.negate) ok = !ok
                      if (ok) return block
                    }, null)
                    .then(block => {
                      if (block != null) {
                        return self.renderAll(block.attachment, context)
                      }
                      return ''
                    })
          })
        )
  }
}
