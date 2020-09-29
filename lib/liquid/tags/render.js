const Liquid = require('../../liquid')

const IsVariableReg = /^('|").*\1$/
const OptionsSyntax = /([a-zA-Z-]+):\s([a-zA-Z0-9\d-_\s"']+)*/g
const Syntax = new RegExp('^(?<filepath>(\'|")?[a-zA-Z-]+\\2)(?<variables>(?:,\\s' + OptionsSyntax.source + ')*)')
const SyntaxHelp = "Syntax Error in 'render' - Valid syntax: render [templateName]"

module.exports = class Include extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)

    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    this.filepath = match.groups.filepath
    this.variables = match.groups.variables.trim()
  }

  isVariable (string) {
    return !IsVariableReg.test(string)
  }

  removeQuotes (string) {
    return string.slice(1, string.length - 1)
  }

  async serializeValue (value, context) {
    if (this.isVariable(value)) {
      return context.get(value)
    } else {
      return this.removeQuotes(value)
    }
  }

  async parseVariables (context) {
    if (!this.variables) return {}

    const options = {}
    let optionsMatch

    // Loop through each option matching the OptionsSyntax regex
    while ((optionsMatch = OptionsSyntax.exec(this.variables))) {
      // Pull out the key/value ([0] is the whole input)
      const [, key, value] = optionsMatch
      options[key] = await this.serializeValue(value, context)
    }

    return options
  }

  async subTemplate (context) {
    this.filepath = await this.serializeValue(this.filepath, context)

    const src = await this.template
      .engine
      .fileSystem
      .readTemplateFile(this.filepath)

    return this.template.engine.parse(src)
  }

  async render (context) {
    const subTemplate = await this.subTemplate(context)
    const variables = await this.parseVariables(context)
    return subTemplate.render(variables)
  }
}
