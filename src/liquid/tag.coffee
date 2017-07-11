module.exports = class Tag
  constructor: (@template, @tagName, @markup) ->

  parseWithCallbacks: (args...) ->
    if @afterParse
      parse = => @parse(args...).then => @afterParse(args...)
    else
      parse = => @parse(args...)

    if @beforeParse
      Promise.resolve(@beforeParse(args...)).then parse
    else
      parse()

  parse: ->

  name: ->
    @constructor.name.toLowerCase()

  render: ->
    ""
