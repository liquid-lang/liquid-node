Liquid = require "../../liquid_base"

# increment is used in a place where one needs to insert a counter
#     into a template, and needs the counter to survive across
#     multiple instantiations of the template.
#     (To achieve the survival, the application must keep the context)
#
#     if the variable does not exist, it is created with value 0.

#   Hello: {% increment variable %}
#
# gives you:
#
#    Hello: 0
#    Hello: 1
#    Hello: 2
#

class Liquid.Increment extends require("../tag")
  constructor: (tagName, markup, tokens) ->
    @variable = markup.trim()
    super

  render: (context) ->
    value = context.environments[0][@variable] or= 0
    context.environments[0][@variable] = value + 1
    value.toString()

Liquid.Template.registerTag "increment", Liquid.Increment
module.exports = Liquid.Increment