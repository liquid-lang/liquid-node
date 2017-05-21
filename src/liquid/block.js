// @flow
import Promise from 'any-promise'
import Tag from './tag'
// import Context from './context'
// import type Template from './template'
import {SyntaxError} from './errors'
import Variable from './variable'
import {TagStart, TagEnd, VariableStart, VariableEnd} from './regexps'

type Token = {
  value: string,
  filename: string,
  line: number,
  col: number
}

const PromiseEach = (promises, cb) => {
  const iterator = index => {
    if (index >= promises.length) {
      return Promise.resolve()
    }
    const promise = promises[index]
    return Promise.resolve(promise)
        .then(value => Promise.resolve(cb(value))
        .then(() => iterator(index + 1)))
  }
  return iterator(0)
}

class Block extends Tag {
  afterParse () {
    return this.assertMissingDelimitation()
  }
  assertMissingDelimitation () {
    if (!this.ended) {
      throw new SyntaxError(`${this.blockName()} tag was never closed`)
    }
  }
  beforeParse () {
    this.nodelist = []
  }
  blockDelimiter () {
    return `end${this.blockName()}`
  }
  blockName () {
    return this.tagName
  }
  constructor (template/*: string */) {
    super(template)
    this.template = template
  }
  endTag () {
    this.ended = true
  }

  parse (...tokens/*: Array<Token> */) {
    if (tokens.length === 0 || this.ended) {
      return Promise.resolve()
    }
    const self = this
    const token = tokens.shift()
    return Promise.resolve()
            .then(() => self.parseToken(token, tokens))
            .catch(e => {
              e.message = `${e.message}\n    at ${token.value} (${token.filename}:${token.line}:${token.col})`
              if (e.location == null) {
                const {col, line, filename} = token
                e.location = {
                  col,
                  line,
                  filename
                }
              }
              throw e
            }).then(() => self.parse(...tokens))
  }
  createVariable (token: Token) {
    let match
    if (Block.ContentOfVariable.test(token.value)) {
      match = Block.ContentOfVariable.exec(token.value)[1]
    }
    if (match) {
      return new Variable(match)
    }

    throw new SyntaxError(`Variable ${token.value}' was not properly terminated with regexp: ${VariableEnd.inspect}`)
  }
  parseToken (token: Token, tokens: Array<Token>) {
    if (Block.IsTag.test(token.value)) {
      const match = Block.FullToken.exec(token.value)
      if (!match) {
        throw new SyntaxError(`Tag '${token.value}' was not properly terminated with regexp: ${TagEnd.inspect}`)
      }
      if (this.blockDelimiter() === match[1]) {
        return this.endTag()
      }
      const Tag = this.template.tags[match[1]]
      if (!Tag) {
        return this.unknownTag(match[1], match[2], tokens)
      }
      const tag = new Tag(this.template, match[1], match[2])
      this.nodelist.push(tag)
      return tag.parseWithCallbacks(tokens)
    } else if (Block.IsVariable.test(token.value)) {
      return this.nodelist.push(this.createVariable(token))
    } else if (token.value.length === 0) {

    } else {
      return this.nodelist.push(token.value)
    }
  }

  render (context/*: Context */) {
    return this.renderAll(this.nodelist, context)
  }
  renderAll (list/*: Array<Promise> */, context/*: Context */) {
    const accumulator = []
    return PromiseEach(list, token => {
      if (token != null && typeof token.render !== 'function') {
        accumulator.push(token)
        return
      }
      return Promise.resolve()
              .then(() => token.render(context))
              .then(s => accumulator.push(s), e => accumulator.push(context.handleError(e)))
    }).then(() => accumulator)
  }
  unknownTag (tag/*: Tag | string */, params/*: Array<any> */, tokens/*: Array<Token> */) {
    if (tag === 'else') {
      throw new SyntaxError(`${this.blockName()} tag does not expect else tag`)
    }
    if (tag === 'end') {
      throw new SyntaxError(`'end' is not a valid delimiter for ${this.blockName()} tags. use ${this.blockDelimiter()}`)
    }
    throw new SyntaxError(`Unknown tag '${tag}'`)
  }
}

Block.IsTag = RegExp(`^${TagStart.source}`)
Block.IsVariable = RegExp(`^${VariableStart.source}`)
Block.FullToken = RegExp(`^${TagStart.source}\\s*(\\w+)\\s*(.*)?${TagEnd.source}$`)
Block.ContentOfVariable = RegExp(`^${VariableStart.source}(.*)${VariableEnd.source}$`)
export default Block
