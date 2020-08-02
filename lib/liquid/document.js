const Liquid = require('../liquid')

module.exports = class Document extends Liquid.Block {
  constructor (template) {
    super()
    this.template = template
  }

  blockDelimiter () {
    return []
  }

  assertMissingDelimitation () {}
}
