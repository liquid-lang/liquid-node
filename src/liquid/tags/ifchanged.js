// @flow
import Context from '../context';
import Block from '../block';
import { toFlatString } from '../helpers';

class IfChanged extends Block {
  async render(context: Context) {
    const rendered = await this.renderAll(this.nodelist, context);
    function stack() {
      const output = toFlatString(rendered);
      if (context.registers.get('ifchanged') !== output) {
        context.registers.set('ifchanged', output);
        return output;
      }
      return '';
    }
    return context.stack(stack);
  }
}

export default IfChanged;
