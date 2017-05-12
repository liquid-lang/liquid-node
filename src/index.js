import _Liquid from './liquid'
import Engine from './liquid/engine'
import * as Helpers from './liquid/helpers'
import Range from './liquid/range'
import Iterable, {IterableForArray} from './liquid/iterable'
import {Drop} from './liquid/drop'
import Context from './liquid/context'
import Tag from './liquid/tag'
import {Block} from './liquid/block'
import {Document} from './liquid/document'
import Variable from './liquid/variable'
import Template from './liquid/template'
import * as StandardFilters from './liquid/standard_filters'
import Condition from './liquid/condition'
import ElseCondition from './liquid/else_condition'
import BlankFileSystem from './liquid/blank_file_system'
import LocalFileSystem from './liquid/local_file_system'

import Assign from './liquid/tags/assign'
import Capture from './liquid/tags/capture'
import Case from './liquid/tags/case'
import Comment from './liquid/tags/comment'
import Decrement from './liquid/tags/decrement'
import For from './liquid/tags/for'
import {If} from './liquid/tags/if'
import Ifchanged from './liquid/tags/ifchanged'
import Increment from './liquid/tags/increment'
import {Raw} from './liquid/tags/raw'
import Unless from './liquid/tags/unless'
import Include from './liquid/tags/include'
import util from 'util'

const customError = (name, inherit = global.Error) => {
  const error = message => {
    this.name = name
    this.message = message
    if (global.Error.captureStackTrace) {
      return global.Error.captureStackTrace(this, error)
    }
    util.inherits(error, inherit)
    return console.error()
  }
  return error
}

const _Error = customError('Error')

const errorNames = [ 'ArgumentError', 'ContextError', 'FilterNotFound', 'FileSystemError', 'StandardError',
  'StackLevelError', 'SyntaxError' ].map(className => ({[className]: customError(`Liquid.${className}`, _Error)}))
// errorNames.forEach(className => { Liquid[className] = customError(`Liquid.${className}`, Liquid.Error) })

const Liquid = Object.assign({}, _Liquid, ...errorNames, {
  Assign,
  BlankFileSystem,
  Block,
  Capture,
  Case,
  Comment,
  Condition,
  Context,
  Decrement,
  Document,
  Drop,
  ElseCondition,
  Engine,
  For,
  Helpers,
  If,
  Ifchanged,
  Include,
  Increment,
  Iterable,
  IterableForArray,
  LocalFileSystem,
  Range,
  Raw,
  StandardFilters,
  Tag,
  Template,
  Unless,
  Variable
})

export {Liquid}
