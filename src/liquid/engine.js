// @flow
import Template from './template'
import Liquid from '../liquid'
import {ArgumentError} from './errors'
import BlankFileSystem from './blank_file_system'
import {Block} from './block'
import * as StandardFilters from './standard_filters'
import Tag from './tag'

class Engine <T> {
  tags: Map<string, Tag> = new Map()
  Strainer: Map<string, Function> = new Map()
  fileSystem = new BlankFileSystem()

  constructor () {
    // this.tags: Map<string, Tag> = new Map()
    // this.Strainer : Map<string, Function> = new Map()
    const isSubclassOf = (klass, ofKlass) => {
      if (typeof klass !== 'function') {
        return false
      } else if (klass === ofKlass) {
        return true
      } else {
        return isSubclassOf((Object.getPrototypeOf(klass) ? Object.getPrototypeOf(klass).constructor : undefined), ofKlass)
      }
    }
    this.registerFilters(StandardFilters)
    // this.fileSystem = new BlankFileSystem()

    for (const [tagName, tag] of Liquid) {
      if (!isSubclassOf(tag, Tag)) {
        continue
      };
      const isBlockOrTagBaseClass = [Tag, Block].includes(tag.constructor)
      if (!isBlockOrTagBaseClass) {
        this.registerTag(tagName.toLowerCase(), tag)
      }
    }
  }
  registerTag (name/*: string */, tag/*: Tag */) {
    this.tags.set(name, tag)
  }
  registerFilters (...filters: Array<{[key: string]: Function}>) {
    for (const filter of filters) {
      for (const filt in filter) {
        if (filt.hasOwnProperty(filt)) {
          if (filt instanceof Function) {
            this.Strainer.set(filt, filter[filt])
          }
        }
      }
    }
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
