Liquid = require "../../liquid_base"
_ = (require "underscore")._
futures = require "futures"

module.exports = class If extends require("../block")
  SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]"

  Syntax = ///
      (#{Liquid.QuotedFragment.source})\s*
      ([=!<>a-z_]+)?\s*
      (#{Liquid.QuotedFragment.source})?
    ///

  ExpressionsAndOperators = ///
    (?:
      \b(?:\s?and\s?|\s?or\s?)\b
      |
      (?:\s*
        (?!\b(?:\s?and\s?|\s?or\s?)\b)
        (?:#{Liquid.QuotedFragment.source}|\S+)
      \s*)
    +)
  ///

  constructor: (tagName, markup, tokens) ->
    @blocks = []
    @pushBlock('if', markup)
    super

  unknownTag: (tag, markup, tokens) ->
    if ["elsif", "else"].indexOf(tag) >= 0
      @pushBlock(tag, markup)
    else
      super

  render: (context) ->
    context.stack =>
      result = futures.future()

      blockToRender = null

      futures.forEachAsync(@blocks, (next, block, index) ->
        if blockToRender
          next()
        else
          Liquid.Helpers.unfuture block.evaluate(context), (err, ok) ->
            return result.deliver err if err
            ok = !ok if block.negate
            blockToRender = block if ok
            next()
      ).then =>
        if blockToRender
          rendered = @renderAll(blockToRender.attachment, context)
          Liquid.Helpers.unfuture rendered, (args...) ->
            result.deliver(args...)
        else
          result.deliver null, ""

      result

  # private

  pushBlock: (tag, markup) ->
    block = if tag == "else"
      new Liquid.ElseCondition()
    else
      expressions = Liquid.Helpers.scan(markup, ExpressionsAndOperators)
      expressions = expressions.reverse()
      match = Syntax.exec expressions.shift()

      throw new Liquid.SyntaxError(SyntaxHelp) unless match

      condition = new Liquid.Condition(match[1..3]...)

      while expressions.length > 0
        operator = String(expressions.shift()).trim()

        match = Syntax.exec expressions.shift()
        throw new SyntaxError(SyntaxHelp) unless match

        newCondition = new Liquid.Condition(match[1..3]...)
        newCondition[operator].call(newCondition, condition)
        condition = newCondition

      condition

    @blocks.push block
    @nodelist = block.attach([])

Liquid.Template.registerTag "if", If