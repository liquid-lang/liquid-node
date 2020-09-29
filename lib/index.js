const Liquid = require('./liquid')
const util = require('util')

function createCustomError (name, inherit = global.Error) {
  const error = function (message) {
    this.name = name
    this.message = message
    if (global.Error.captureStackTrace) {
      return global.Error.captureStackTrace(this, arguments.callee)  // eslint-disable-line
    }
  }
  util.inherits(error, inherit)
  return error
}
Liquid.Error = createCustomError('Error');

['ArgumentError', 'ContextError', 'FilterNotFound', 'FileSystemError', 'StandardError', 'StackLevelError', 'SyntaxError'].forEach(className => {
  Liquid[className] = createCustomError('Liquid.' + className, Liquid.Error)
  return Liquid[className]
})

Liquid.Engine = require('./liquid/engine')
Liquid.Helpers = require('./liquid/helpers')
Liquid.Range = require('./liquid/range')
Liquid.Iterable = require('./liquid/iterable')
Liquid.Drop = require('./liquid/drop')
Liquid.Context = require('./liquid/context')
Liquid.Tag = require('./liquid/tag')
Liquid.Block = require('./liquid/block')
Liquid.Document = require('./liquid/document')
Liquid.Variable = require('./liquid/variable')
Liquid.Template = require('./liquid/template')
Liquid.StandardFilters = require('./liquid/standard_filters')
Liquid.Condition = require('./liquid/condition')
Liquid.ElseCondition = require('./liquid/else_condition')
Liquid.BlankFileSystem = require('./liquid/blank_file_system')
Liquid.LocalFileSystem = require('./liquid/local_file_system')
Liquid.Assign = require('./liquid/tags/assign')
Liquid.Capture = require('./liquid/tags/capture')
Liquid.Case = require('./liquid/tags/case')
Liquid.Comment = require('./liquid/tags/comment')
Liquid.Decrement = require('./liquid/tags/decrement')
Liquid.For = require('./liquid/tags/for')
Liquid.If = require('./liquid/tags/if')
Liquid.Ifchanged = require('./liquid/tags/ifchanged')
Liquid.Increment = require('./liquid/tags/increment')
Liquid.Raw = require('./liquid/tags/raw')
Liquid.Unless = require('./liquid/tags/unless')
Liquid.Include = require('./liquid/tags/include')
Liquid.Render = require('./liquid/tags/render')

module.exports = Liquid
