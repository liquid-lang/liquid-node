// @flow
import Template from './template'
import {ArgumentError} from './errors'
import BlankFileSystem from './blank_file_system'
import Block from './block'
import StandardFilters from './standard_filters'
import Tag from './tag'
import Tags from './tags'

class Engine {
  tags: Map<string, Tag> = new Map()
  Strainer: Map<string, Function> = new Map()
  fileSystem = new BlankFileSystem()

  constructor () {
    // this.tags: Map<string, Tag> = new Map()
    // this.Strainer : Map<string, Function> = new Map()
    const isSubclassOf = (klass, ofKlass) => {
      if (typeof klass !== 'function') {
        return false
      }
      if (klass === ofKlass) {
        return true
      }
      return klass instanceof ofKlass
    }
    this.registerFilters(StandardFilters)
    // this.fileSystem = new BlankFileSystem()

    for (const tag in Tags) {
      if (Tags.hasOwnProperty(tag)) {
        const func = Tags[tag]
        if (!isSubclassOf(func, Tag)) {
          continue
        }
        const isBlockOrTagBaseClass = [Tag, Block].includes(func.constructor)
        if (!isBlockOrTagBaseClass) {
          this.registerTag(tag.toLowerCase(), func)
        }
      }
    }
  }
  registerTag (name/*: string */, tag/*: Tag */) {
    this.tags.set(name, tag)
  }
  registerFilters (filters/*: Map<string, Function> */) {
    Array.from(filters.entries())
         .filter(([key, fun]) => fun != null)
         .forEach(([key, fun]) => this.Strainer.set(key, fun))
  }
  parse (source/*: string */) {
    const template = new Template()
    return template.parse(this, source)
  }
  parseAndRender (source/*: string */, ...args/*: mixed[] */) {
    return this.parse(source)
    .then(template => template.render(...args))
  }
  registerFileSystem (fileSystem/*: BlankFileSystem */) {
    if (!(fileSystem instanceof BlankFileSystem)) {
      throw ArgumentError('Must be subclass of Liquid.BlankFileSystem')
    }
    this.fileSystem = fileSystem
  }
}

export default Engine
