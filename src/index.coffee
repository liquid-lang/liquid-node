Liquid = require "./liquid"
util = require "util"

# based on node's lib/assert.js
customError = (name, inherit = global.Error) ->
  error = (message) ->
    @name = name
    @message = message

    if global.Error.captureStackTrace
      global.Error.captureStackTrace(@, arguments.callee)

  util.inherits error, inherit
  error

Liquid.Error = customError "Error"

# Errors
[ "ArgumentError", "ContextError", "FilterNotFound",
  "FileSystemError", "StandardError", "StackLevelError",
  "SyntaxError", "UndefinedVariable"
].forEach (className) ->

  Liquid[className] = customError("Liquid.#{className}", Liquid.Error)

Liquid.Engine           = require("./liquid/engine")
Liquid.Helpers          = require("./liquid/helpers")
Liquid.Range            = require("./liquid/range")
Liquid.Iterable         = require("./liquid/iterable")
Liquid.Drop             = require("./liquid/drop")
Liquid.Context          = require("./liquid/context")
Liquid.Tag              = require("./liquid/tag")
Liquid.Block            = require("./liquid/block")
Liquid.Document         = require("./liquid/document")
Liquid.Variable         = require("./liquid/variable")
Liquid.Template         = require("./liquid/template")
Liquid.StandardFilters  = require("./liquid/standard_filters")
Liquid.Condition        = require("./liquid/condition")
Liquid.ElseCondition    = require("./liquid/else_condition")
Liquid.BlankFileSystem  = require("./liquid/blank_file_system")
Liquid.LocalFileSystem  = require("./liquid/local_file_system")

Liquid.Assign           = require("./liquid/tags/assign")
Liquid.Capture          = require("./liquid/tags/capture")
Liquid.Case             = require("./liquid/tags/case")
Liquid.Comment          = require("./liquid/tags/comment")
Liquid.Decrement        = require("./liquid/tags/decrement")
Liquid.For              = require("./liquid/tags/for")
Liquid.If               = require("./liquid/tags/if")
Liquid.Ifchanged        = require("./liquid/tags/ifchanged")
Liquid.Increment        = require("./liquid/tags/increment")
Liquid.Raw              = require("./liquid/tags/raw")
Liquid.Unless           = require("./liquid/tags/unless")
Liquid.Include          = require("./liquid/tags/include")

module.exports = Liquid
