Liquid = require "../../liquid_base"

class Liquid.Comment extends require("../block")
  render: ->
    ""

Liquid.Template.registerTag("comment", Liquid.Comment)