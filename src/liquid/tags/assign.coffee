Liquid = require "../../liquid_base"

class Liquid.Assign extends require("../tag")
  SyntaxHelp = "Syntax Error in 'assign' - Valid syntax: assign [var] = [source]"
  Syntax = ///
      ((?:#{Liquid.VariableSignature.source})+)
      \s*=\s*
      ((?:#{Liquid.QuotedFragment.source}))
    ///

  constructor: (tagName, markup, tokens) ->
    if match = Syntax.exec(markup)
      @to = match[1]
      @from = match[2]
    else
      throw new Liquid.SyntaxError(SyntaxHelp)

    super

  render: (context) ->
    value = context.get(@from)

    Liquid.Helpers.unfuture value, (err, value) =>
      Liquid.log "#{@from} -> #{@to}: %j", value
      context.lastScope()[@to] = value
      ''

Liquid.Template.registerTag('assign', Liquid.Assign)
module.exports = Liquid.Assign