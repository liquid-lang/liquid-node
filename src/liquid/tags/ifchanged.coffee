Liquid = require "../../liquid_base"
futures = require "futures"

class Liquid.Ifchanged extends require("../block")
  render: (context) ->
    context.stack =>
      rendered = @renderAll(@nodelist, context)

      Liquid.Helpers.unfuture rendered, (err, output) ->
        return futures.future().deliver(err) if err

        if output != context.registers["ifchanged"]
          context.registers["ifchanged"] = output
          output
        else
          ""

Liquid.Template.registerTag "ifchanged", Liquid.Ifchanged
module.exports = Liquid.Ifchanged