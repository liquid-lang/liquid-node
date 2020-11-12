const Liquid = require('../../liquid')

const IsStringReg = /^('|").*\1$/
const OptionsSyntax = /([a-zA-Z-_]+):\s([a-zA-Z0-9\d-_\s"']+)/g
const OperatorSyntax = /(?<keyword>with|for)\s(?<value>[a-zA-Z-_]+)\sas\s(?<key>[a-zA-Z0-9\d-_\s"']+)/
const Syntax = new RegExp(`^(?<filepath>('|")?[a-zA-Z-]+\\2)(?<variables>(?:\\s${OperatorSyntax.source}|(?:,\\s${OptionsSyntax.source})*))`)
const SyntaxHelp = "Syntax Error in 'render' - Valid syntax: render [templateName]"

module.exports = class Render extends Liquid.Tag {
  constructor (template, tagName, markup) {
    super(template, tagName, markup)

    const match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }

    this.filepath = match.groups.filepath
    this.variables = match.groups.variables.trim()

    if (match.groups.keyword) {
      this.keyword = match.groups.keyword
      this.operatorKey = match.groups.key.trim()
      this.operatorValue = match.groups.value.trim()
    }
  }

  async serializeValue (value, context) {
    if (IsStringReg.test(value)) {
      // It starts/ends with quotes, so let's remove them
      return value.slice(1, value.length - 1)
    } else {
      // It doesn't start/end with quotes, so its a variable
      return context.get(value)
    }
  }

  async parseVariables (context) {
    // The variables string was empty, so there aren't any values to parse
    if (!this.variables) return {}

    if (this.keyword) {
      return {
        // Using `with [key] as [value]`, we return an object of just that k/v pair
        [this.operatorKey]: await this.serializeValue(this.operatorValue, context)
      }
    }

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
    // The filepath may be a "string" or a variable
    this.filepath = await this.serializeValue(this.filepath, context)

    const src = await this.template
      .engine
      .fileSystem
      .readTemplateFile(this.filepath)

    return this.template.engine.parse(src)
  }

  async renderAll (subTemplate, variables) {
    const renders = []
    const value = variables[this.operatorKey]
    if (!value) return
    const length = value.length

    for (let index = 0; index < length; index++) {
      const item = value[index]
      const forloop = {
        length: length,
        index: index + 1,
        index0: index,
        rindex: length - index,
        rindex0: length - index - 1,
        first: index === 0,
        last: index === length - 1
      }

      const rendered = await subTemplate.render({ [this.operatorKey]: item, forloop })
      renders.push(rendered)
    }

    return renders.join('')
  }

  async render (context) {
    // Parse the referenced snippet
    const subTemplate = await this.subTemplate(context)
    // Parse the variables in the tag and return a new context object
    const variables = await this.parseVariables(context)

    if (this.keyword === 'for') {
      return this.renderAll(subTemplate, variables)
    } else {
      return subTemplate.render(variables)
    }
  }
}
