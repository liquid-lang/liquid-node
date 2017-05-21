// @flow
import Context from '../context'
import Tag from '../tag'
import Template from '../template'

class Increment extends Tag {
  constructor (template: Template, tagName: string, markup: string) {
    super(template, tagName, markup)
    this.variable = markup.trim()
  }
  render (context: Context) {
    const value = (context.environments[0][this.variable]) || 0
    context.environments[0][this.variable] = value + 1
    return String(value)
  }
}

export default Increment
