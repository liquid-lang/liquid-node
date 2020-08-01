const Liquid = require('../../liquid')

const Syntax = /([a-z0-9/\\_-]+)/i
const SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]"

module.exports = class Include extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)

    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    this.filepath = match[1]
  }

  async subTemplate () {
    const src = await this.template
      .engine
      .fileSystem
      .readTemplateFile(this.filepath)
    return this.template.engine.parse(src)
  }

  async render (context) {
    const subTemplate = await this.subTemplate()
    return subTemplate.render(context)
  }
}
