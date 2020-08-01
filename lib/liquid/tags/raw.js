const Liquid = require('../../liquid')

module.exports = class Raw extends Liquid.Block {
  async parse (tokens) {
    if (tokens.length === 0 || this.ended) {
      return
    }

    const token = tokens.shift()
    const match = Liquid.Block.FullToken.exec(token.value)

    if ((match != null ? match[1] : void 0) === this.blockDelimiter()) {
      return this.endTag()
    }

    this.nodelist.push(token.value)
    return this.parse(tokens)
  }
}
