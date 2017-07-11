Liquid = require "../../liquid"

module.exports = class Raw extends Liquid.Block
  parse: (tokens) ->
    Promise.resolve().then =>
      return Promise.resolve() if tokens.length is 0 or @ended

      token = tokens.shift()
      match = Liquid.Block.FullToken.exec token.value

      return @endTag() if match?[1] is @blockDelimiter()

      @nodelist.push token.value
      @parse tokens
