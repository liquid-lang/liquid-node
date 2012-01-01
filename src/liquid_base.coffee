util = require "util"

module.exports = class Liquid
  @log = ->
    return unless debug?

    try
      console.log(arguments...)
    catch e
      console.log "Failed to log. %s", e

  @FilterSeparator             = /\|/
  @ArgumentSeparator           = /,/
  @FilterArgumentSeparator     = /\:/
  @VariableAttributeSeparator  = /\./
  @TagStart                    = /\{\%/
  @TagEnd                      = /\%\}/
  @VariableSignature           = /\(?[\w\-\.\[\]]\)?/
  @VariableSegment             = /[\w\-]/
  @VariableStart               = /\{\{/
  @VariableEnd                 = /\}\}/
  @VariableIncompleteEnd       = /\}\}?/
  @QuotedString                = /"[^"]*"|'[^']*'/
  @QuotedFragment              = ///#{@QuotedString.source}|(?:[^\s,\|'"]|#{@QuotedString.source})+///
  @StrictQuotedFragment        = /"[^"]+"|'[^']+'|[^\s|:,]+/
  @FirstFilterArgument         = ///#{@FilterArgumentSeparator.source}(?:#{@StrictQuotedFragment.source})///
  @OtherFilterArgument         = ///#{@ArgumentSeparator.source}(?:#{@StrictQuotedFragment.source})///
  @SpacelessFilter             = ///^(?:'[^']+'|"[^"]+"|[^'"])*#{@FilterSeparator.source}(?:#{@StrictQuotedFragment.source})(?:#{@FirstFilterArgument.source}(?:#{@OtherFilterArgument.source})*)?///
  @Expression                  = ///(?:#{@QuotedFragment.source}(?:#{@SpacelessFilter.source})*)///
  @TagAttributes               = ///(\w+)\s*\:\s*(#{@QuotedFragment.source})///
  @AnyStartingTag              = /\{\{|\{\%/
  @PartialTemplateParser       = ///#{@TagStart.source}.*?#{@TagEnd.source}|#{@VariableStart.source}.*?#{@VariableIncompleteEnd.source}///
  @TemplateParser              = ///(#{@PartialTemplateParser.source}|#{@AnyStartingTag.source})///
  @VariableParser              = ///\[[^\]]+\]|#{@VariableSegment.source}+\??///

# based on node's lib/assert.js
customError = (name, inherit = global.Error) ->
  error = (message) ->
    @name = name
    @message = message

    if global.Error.captureStackTrace
      global.Error.captureStackTrace(@, arguments.callee)

  util.inherits(error, inherit)
  error:: = inherit::
  error

Liquid.Error = customError "Error"

# Errors
[ "ArgumentError", "ContextError", "FilterNotFound",
  "FilterNotFound", "FileSystemError", "StandardError",
  "StackLevelError", "SyntaxError"
].forEach (className) =>

  Liquid[className] = customError("Liquid.#{className}", Liquid.Error)

# TODO
# HtmlTags, FileSystem
