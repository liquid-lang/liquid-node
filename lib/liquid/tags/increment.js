const Liquid = require('../../liquid')

module.exports = class Increment extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)
    this.variable = markup.trim()
  }

  render (context) {
    const base = context.environments[0]
    if (!base[this.variable]) base[this.variable] = 0
    const value = base[this.variable]
    context.environments[0][this.variable] = value + 1
    return value.toString()
  }
}
