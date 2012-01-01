Liquid = require "../../liquid_base"

# decrement is used in a place where one needs to insert a counter
#     into a template, and needs the counter to survive across
#     multiple instantiations of the template.
#     NOTE: decrement is a pre-decrement, --i,
#           while increment is post:      i++.
#
#     (To achieve the survival, the application must keep the context)
#
#     if the variable does not exist, it is created with value 0.

#   Hello: {% decrement variable %}
#
# gives you:
#
#    Hello: -1
#    Hello: -2
#    Hello: -3
#
class Liquid.Decrement extends require("../tag")
  constructor: (tagName, markup, tokens) ->
    @variable = markup.trim()
    super

  render: (context) ->
    value = context.environments[0][@variable] or= 0
    value = value - 1
    context.environments[0][@variable] = value
    value.toString()

Liquid.Template.registerTag "decrement", Liquid.Decrement
module.exports = Liquid.Decrement