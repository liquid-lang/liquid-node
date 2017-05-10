import Template from './template'
import Liquid from '../liquid'

class Engine {
  constructor () {
    const self = this
    this.tags = {}
    this.Strainer = (context) => {
      self.context = context
    }
    const isSubclassOf = (klass, ofKlass) => {
      if (typeof klass !== 'function') {
        return false
      } else if (klass === ofKlass) {
        return true
      } else {
        return isSubclassOf((Object.getPrototypeOf(klass) ? Object.getPrototypeOf(klass).constructor : undefined), ofKlass)
      }
    }
    this.registerFilters(Liquid.StandardFilters)
    this.fileSystem = new Liquid.BlankFileSystem()

    for (const [tagName, tag] of Liquid) {
      if (!isSubclassOf(tag, Liquid.Tag)) {
        continue
      };
      const isBlockOrTagBaseClass = [Liquid.Tag, Liquid.Block].includes(tag.constructor)
      if (!isBlockOrTagBaseClass) {
        this.registerTag(tagName.toLowerCase(), tag)
      }
    }
  }
  registerTag (name, tag) {
    this.tags[name] = tag
  }
  registerFilters (...filters) {
    filters.forEach(filter => {
      for (const [k, v] of filter) {
        if (v instanceof Function) {
          this.Strainer.prototype[k] = v
        }
      }
    })
  }
  parse (source) {
    const template = new Template()
    return template.parse(this, source)
  }
  parseAndRender (source, ...args) {
    return this.parse(source)
    .then(template => template.render(...args))
  }
  registerFileSystem (fileSystem) {
    if (!(fileSystem instanceof Liquid.BlankFileSystem)) {
      throw Liquid.ArgumentError('Must be subclass of Liquid.BlankFileSystem')
    }
    this.fileSystem = fileSystem
  }
}

export default Engine
