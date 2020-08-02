const Liquid = require('../liquid')

module.exports = Liquid.Document = class Document extends Liquid.Block {
  constructor (template) {
    super()
    this.template = template
  }

  blockDelimiter () {
    return []
  }

  assertMissingDelimitation () {}
}
