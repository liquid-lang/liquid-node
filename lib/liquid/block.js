const Liquid = require('../liquid')

class Block extends Liquid.Tag {
  beforeParse () {
    if (!this.nodelist) {
      this.nodelist = []
    }
    this.nodelist.length = 0
    return this.nodelist.length
  }

  afterParse () {
    return this.assertMissingDelimitation()
  }

  async parse (tokens) {
    if (tokens.length === 0 || this.ended) {
      return
    }

    const token = tokens.shift()

    try {
      await this.parseToken(token, tokens)
    } catch (err) {
      err.message = err.message + '\n    at ' + token.value + ' (' + token.filename + ':' + token.line + ':' + token.col + ')'
      if (!err.location) {
        err.location = {
          col: token.col,
          line: token.line,
          filename: token.filename
        }
      }
      throw err
    }

    return this.parse(tokens)
  }

  async parseToken (token, tokens) {
    if (Block.IsTag.test(token.value)) {
      const match = Block.FullToken.exec(token.value)
      if (!match) {
        throw new Liquid.SyntaxError("Tag '" + token.value + "' was not properly terminated with regexp: " + Liquid.TagEnd.inspect)
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
    } else if (token.value.length !== 0) {
      return this.nodelist.push(token.value)
    }
  }

  endTag () {
    this.ended = true
    return this.ended
  }

  unknownTag (tag, params, tokens) {
    if (tag === 'else') {
      throw new Liquid.SyntaxError((this.blockName()) + ' tag does not expect else tag')
    } else if (tag === 'end') {
      throw new Liquid.SyntaxError("'end' is not a valid delimiter for " + (this.blockName()) + ' tags. use ' + (this.blockDelimiter()))
    } else {
      throw new Liquid.SyntaxError("Unknown tag '" + tag + "'")
    }
  }

  blockDelimiter () {
    return 'end' + (this.blockName())
  }

  blockName () {
    return this.tagName
  }

  createVariable (token) {
    const ref = Liquid.Block.ContentOfVariable.exec(token.value)
    const match = ref != null ? ref[1] : void 0
    if (match) {
      return new Liquid.Variable(match)
    }
    throw new Liquid.SyntaxError("Variable '" + token.value + "' was not properly terminated with regexp: " + Liquid.VariableEnd.inspect)
  }

  async render (context) {
    return this.renderAll(this.nodelist, context)
  }

  assertMissingDelimitation () {
    if (!this.ended) {
      throw new Liquid.SyntaxError((this.blockName()) + ' tag was never closed')
    }
  }

  async renderAll (list, context) {
    const accumulator = []

    for (const token of list) {
      if (token && typeof token.render !== 'function') {
        accumulator.push(token)
        continue
      }

      try {
        const renderedToken = await token.render(context)
        accumulator.push(renderedToken)
      } catch (err) {
        accumulator.push(context.handleError(err))
      }
    }

    return accumulator
  }
}

Block.IsTag = RegExp('^' + Liquid.TagStart.source)
Block.IsVariable = RegExp('^' + Liquid.VariableStart.source)
Block.FullToken = RegExp('^' + Liquid.TagStart.source + '\\s*(\\w+)\\s*(.*)?' + Liquid.TagEnd.source + '$')
Block.ContentOfVariable = RegExp('^' + Liquid.VariableStart.source + '(.*)' + Liquid.VariableEnd.source + '$')

module.exports = Block
