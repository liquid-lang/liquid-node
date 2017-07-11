Liquid = require "../../liquid"

module.exports = class IfChanged extends Liquid.Block
  render: (context) ->
    context.stack =>
      rendered = @renderAll @nodelist, context

      Promise.resolve(rendered).then (output) ->
        output = Liquid.Helpers.toFlatString output

        if output isnt context.registers.ifchanged
          context.registers.ifchanged = output
        else
          ""
