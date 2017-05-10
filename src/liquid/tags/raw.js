import Promise from 'any-promise'
import {Block} from '../block'

class Raw extends Block {
  parse (tokens/*: Array<token> */) {
    const self = this
    return Promise.resolve()
        .then(() => {
          if (tokens.length === 0 || self.ended) {
            return Promise.resolve()
          }
          const token = tokens.shift()
          const match = Block.FullToken.exec(token.value)
          if (match && match[1] === self.blockDelimiter()) {
            return self.endTag()
          }
          self.nodelist.push(token.value)
          self.parse(tokens)
        })
  }
}

export {Raw}
