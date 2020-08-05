const Liquid = require('../../liquid')

const Syntax = /((?:{{2}\s?)?[a-z0-9/\\_.-]+(?:\s?}{2})?)/i
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

  async subTemplate (context) {
    if (this.filepath.startsWith('{{') && this.filepath.endsWith('}}')) {
      this.filepath = await context.get(this.filepath)
    }

    const src = await this.template
      .engine
      .fileSystem
      .readTemplateFile(this.filepath)
    return this.template.engine.parse(src)
  }

  async render (context) {
    const subTemplate = await this.subTemplate(context)
    return subTemplate.render(context)
  }
}
