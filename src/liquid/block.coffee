Liquid = require("../liquid")
util = require "util"

# Iterates over promises sequentially
Promise_each = (promises, cb) ->
  iterator = (index) ->
    return Promise.resolve() if index >= promises.length
    promise = promises[index]

    Promise.resolve(promise).then (value) ->
      Promise.resolve(cb(value)).then ->
        iterator(index + 1)

  iterator(0)

module.exports = class Block extends Liquid.Tag
  @IsTag             = ///^#{Liquid.TagStart.source}///
  @IsVariable        = ///^#{Liquid.VariableStart.source}///
  @FullToken         = ///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///
  @ContentOfVariable = ///^#{Liquid.VariableStart.source}(.*)#{Liquid.VariableEnd.source}$///

  beforeParse: ->
    @nodelist ?= []
    @nodelist.length = 0 # clear array

  afterParse: ->
    # Make sure that its ok to end parsing in the current block.
    # Effectively this method will throw and exception unless the
    # current block is of type Document
    @assertMissingDelimitation()

  parse: (tokens) ->
    return Promise.resolve() if tokens.length is 0 or @ended
    token = tokens.shift()

    Promise.resolve().then =>
      @parseToken token, tokens
    .catch (e) ->
      e.message = "#{e.message}\n    at #{token.value} (#{token.filename}:#{token.line}:#{token.col})"
      e.location ?= { col: token.col, line: token.line, filename: token.filename }
      throw e
    .then =>
      @parse tokens

  parseToken: (token, tokens) ->
    if Block.IsTag.test(token.value)
      match = Block.FullToken.exec(token.value)

      unless match
        throw new Liquid.SyntaxError("Tag '#{token.value}' was not properly terminated with regexp: #{Liquid.TagEnd.inspect}")

      return @endTag() if @blockDelimiter() is match[1]

      Tag = @template.tags[match[1]]
      return @unknownTag match[1], match[2], tokens unless Tag

      tag = new Tag @template, match[1], match[2]
      @nodelist.push tag
      tag.parseWithCallbacks tokens
    else if Block.IsVariable.test(token.value)
      @nodelist.push @createVariable(token)
    else if token.value.length is 0
      # skip empty tokens
    else
      @nodelist.push token.value

  endTag: ->
    @ended = true

  unknownTag: (tag, params, tokens) ->
    if tag is 'else'
      throw new Liquid.SyntaxError("#{@blockName()} tag does not expect else tag")
    else if tag is 'end'
      throw new Liquid.SyntaxError("'end' is not a valid delimiter for #{@blockName()} tags. use #{@blockDelimiter()}")
    else
      throw new Liquid.SyntaxError("Unknown tag '#{tag}'")

  blockDelimiter: ->
    "end#{@blockName()}"

  blockName: ->
    @tagName

  createVariable: (token) ->
    match = Liquid.Block.ContentOfVariable.exec(token.value)?[1]
    return new Liquid.Variable(match) if match
    throw new Liquid.SyntaxError("Variable '#{token.value}' was not properly terminated with regexp: #{Liquid.VariableEnd.inspect}")

  render: (context) ->
    @renderAll @nodelist, context

  assertMissingDelimitation: ->
    throw new Liquid.SyntaxError("#{@blockName()} tag was never closed") unless @ended

  renderAll: (list, context) ->
    accumulator = []

    Promise_each list, (token) ->
      unless typeof token?.render is "function"
        accumulator.push token
        return

      Promise.resolve().then ->
        token.render context
      .then (s) ->
        accumulator.push s
      , (e) ->
        accumulator.push context.handleError e
    .then ->
      accumulator
