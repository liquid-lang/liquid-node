// @flow
import Promise from 'any-promise'
import Context from '../context'
import Block from '../block'
import {toFlatString} from '../helpers'

class IfChanged extends Block {
  render (context: Context): string {
    const self = this
    return context.stack(() => {
      const rendered = self.renderAll(self.nodelist, context)
      return Promise.resolve(rendered).then((output) => {
        output = toFlatString(output)
        if (output !== context.registers.ifchanged) {
          context.registers.ifchanged = output
          return output
        }
        return ''
      })
    })
  }
}

export default IfChanged
