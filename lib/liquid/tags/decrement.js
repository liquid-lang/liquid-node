const Liquid = require('../../liquid')

module.exports = class Decrement extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    this.variable = markup.trim()
  }

  render (context) {
    const base = context.environments[0]
    if (!base[this.variable]) base[this.variable] = 0
    const value = base[this.variable] - 1
    context.environments[0][this.variable] = value
    return value.toString()
  }
}
