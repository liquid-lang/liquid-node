import Promise from 'any-promise'

class Tag {
  constructor (template, tagName, markup) {
    this.template = template
    this.tagName = tagName
    this.markup = markup
  }

  parseWithCallbacks (...args) {
    const self = this
    let parse
    if (this.afterParse) {
      parse = () => Promise.resolve(self.parse(...args)).then(() => self.afterParse(...args))
    } else {
      parse = () => Promise.resolve(self.parse(...args))
    }

    if (this.beforeParse) {
      return Promise.resolve(this.beforeParse(...args)).then(parse())
    }
    return parse()
  }

  parse () { /* noop */ }
  name () {
    return this.constructor.name.toLowerCase()
  }
  render () {
    return ''
  }
}

export default Tag
