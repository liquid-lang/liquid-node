const Liquid = require('../../liquid')

module.exports = class IfChanged extends Liquid.Block {
  async render (context) {
    return context.stack(async () => {
      const rendered = await this.renderAll(this.nodelist, context)
      const output = Liquid.Helpers.toFlatString(rendered)
      if (output !== context.registers.ifchanged) {
        context.registers.ifchanged = output
        return context.registers.ifchanged
      } else {
        return ''
      }
    })
  }
}
