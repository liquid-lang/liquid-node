const Liquid = require('../../liquid')

const IsVariableReg = /^('|").*\1$/
const OptionsSyntax = /(?:,\s)?(?<key>[a-zA-Z-]+):\s(?<value>[a-zA-Z0-9\d-_\s]+)*/g
const Syntax = new RegExp('(?<filename>[a-zA-Z-]+)(?<variables>(?:\\s' + OptionsSyntax.source + ')*)')
const SyntaxHelp = "Syntax Error in 'render' - Valid syntax: render [templateName]"

module.exports = class Include extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)

    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    this.filepath = match.groups.filepath
    this.variables = match.groups.variables
  }

  isVariable (string) {
    return IsVariableReg.test(string)
  }

  parseVariables () {
    if (!this.variables) return {}
    const options = {}
    let optionsMatch

    // Loop through each option matching the OptionsSyntax regex
    while ((optionsMatch = OptionsSyntax.exec(this.variables))) {
      // Pull out the key/value ([0] is the whole input)
      const [, key, value] = optionsMatch
      options[key] = value
    }

    return options
  }

  async subTemplate (context) {
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
