const slice = [].slice

module.exports = class Tag {
  constructor (template, tagName, markup) {
    this.template = template
    this.tagName = tagName
    this.markup = markup
  }

  async parseWithCallbacks () {
    const args = arguments.length >= 1 ? slice.call(arguments, 0) : []

    if (this.beforeParse) {
      await this.beforeParse.apply(this, args)
    }

    await this.parse.apply(this, args)

    if (this.afterParse) {
      await this.afterParse.apply(this, args)
    }
  }

  parse () {}

  name () {
    return this.constructor.name.toLowerCase()
  }

  render () {
    return ''
  }
}
