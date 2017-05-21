// @flow
import Context from '../context'
import Tag from '../tag'
import Template from '../template'

const Syntax = /([a-z0-9/\\_-]+)/i
const SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]"
class Include extends Tag {
  filepath = ''
  constructor (template: Template, tagName: string, markup: string, tokens: Array<mixed>) {
    super(template, tagName, markup)
    const match = Syntax.exec(markup)
    if (!match) {
      throw new SyntaxError(SyntaxHelp)
    }
    this.filepath = match[1]
    this.subTemplate = template.engine.fileSystem.readTemplateFile(this.filepath)
      .then(src => template.engine.parse(src))
  }
  render (context: Context): string {
    return this.subTemplate.then(i => i.render(context))
  }
}

export default Include
