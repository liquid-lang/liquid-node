const Liquid = require('../../liquid')

module.exports = class Unless extends Liquid.If {
  async parse (tokens) {
    await super.parse(tokens)
    this.blocks[0].negate = true
  }
}
