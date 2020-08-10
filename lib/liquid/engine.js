const Liquid = require('../liquid')

module.exports = class Engine {
  constructor () {
    this.tags = {}
    this.Strainer = function (context) {
      this.context = context
    }

    this.registerFilters(Liquid.StandardFilters)
    this.fileSystem = new Liquid.BlankFileSystem()

    for (const tagName in Liquid) {
      if (!Object.prototype.hasOwnProperty.call(Liquid, tagName)) continue
      const tag = Liquid[tagName]
      if (!(tag.prototype instanceof Liquid.Tag)) {
        continue
      }
      const isBlockOrTagBaseClass = [Liquid.Tag, Liquid.Block].indexOf(tag.constructor) >= 0
      if (!isBlockOrTagBaseClass) {
        this.registerTag(tagName.toLowerCase(), tag)
      }
    }
  }

  registerTag (name, tag) {
    this.tags[name] = tag
  }

  registerFilters (...filters) {
    return filters.forEach((filter) => {
      const results = []
      for (const key in filter) {
        if (!Object.prototype.hasOwnProperty.call(filter, key)) continue
        const value = filter[key]
        if (value instanceof Function) {
          results.push(this.Strainer.prototype[key] = value)
        } else {
          results.push(void 0)
        }
      }
      return results
    })
  }

  async parse (source) {
    const template = new Liquid.Template()
    return template.parse(this, source)
  }

  async parseAndRender (source, context) {
    const template = await this.parse(source)
    return template.render(context)
  }

  registerFileSystem (fileSystem) {
    if (!(fileSystem instanceof Liquid.BlankFileSystem)) {
      throw Liquid.ArgumentError('Must be subclass of Liquid.BlankFileSystem')
    }
    this.fileSystem = fileSystem
    return this.fileSystem
  }
}
