import Promise from 'any-promise'

import Context from './context'
import Document from './document'
import {toFlatString} from './helpers'
import {TemplateParser} from './regexps'

export default class Template {
  constructor () {
    this.registers = {}
    this.assigns = {}
    this.instanceAssigns = {}
    this.tags = new Map()
    this.errors = []
    this.rethrowErrors = true
  }
  /**
   * Parse source code
   * @param  {Engine} engine      The engine to run on
   * @param  {String} [source=''] the source code to run through the engine
   * @return {this}               returns `this` for easy chaining
   */
  parse (engine, source = '') {
    this.engine = engine
    const self = this
    return Promise.resolve().then(() => {
      const tokens = self._tokenize(source)
      self.tags = self.engine.tags
      self.root = new Document(self)
      return self.root.parseWithCallbacks(...tokens).then(() => self)
    })
  }
  /**
   * Uses the <tt>Liquid::TemplateParser</tt> regexp to tokenize the passed source
   * @param  {String} source The source to tokenize
   * @return {Array<Token>}
   */
  _tokenize (source) {
    source = String(source)
    if (source.length === 0) {
      return []
    }
    const tokens = source.split(TemplateParser)

    let line = 1
    let col = 1

    return tokens.filter(token => token.length > 0)
      .map(value => {
        const result = { value, col, line }
        if (!value.includes('\n')) {
          col += value.length
        } else {
          const linebreaks = value.split('\n').length - 1
          line += linebreaks
          col = value.length - value.lastIndexOf('\n')
        }
        return result
      })
  }
  render (...args) {
    const self = this
    return Promise.resolve().then(() => self._render(...args))
  }
  _render ({assigns, options}) {
    if (!(this.root instanceof Document)) {
      throw new Error('No document root. Did you parse the document yet?')
    }
    let context
    if (assigns instanceof Context) {
      context = assigns
    } else if (assigns instanceof Object) {
      assigns = [assigns, this.assigns]
      context = new Context(this.engine, assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
    } else if (assigns == null) {
      context = new Context(this.engine, this.assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
    } else {
      throw new Error(`Expected Object or Liquid::Context as parameter, but was ${typeof assigns}.`)
    }
    if (options != null) {
      if (options.registers) {
        const registers = Object.assign({}, this.registers, options.registers)
        this.registers = registers
      }
      if (options.filters) {
        context.registerFilters(options.filters)
      }
      const copyErrors = (actualResult) => {
        self.errors = context.errors
        return actualResult
      }
      return this.root.render(context)
        .then(chunks => toFlatString(chunks))
        .then((result) => copyErrors(result))
        .catch((error) => {
          self.errors = context.errors
          throw error
        })
    }
  }
}
