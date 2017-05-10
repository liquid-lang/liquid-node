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
      parse = this.parse(...args).then(() => self.afterParse(...args))
    } else {
      parse = this.parse(...args)
    }

    if (this.beforeParse) {
      Promise.resolve(this.beforeParse(...args)).then(parse())
    } else {
      parse()
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

export default Tag
