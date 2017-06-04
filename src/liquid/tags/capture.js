// @flow

// import Helpers from '../helpers';
import Block from '../block';
import Context from '../context';
import { SyntaxError } from '../errors';
import Template from '../template';

const SYNTAX = /(\w+)/;
const SYNTAX_HELP = 'Syntax Error in \'capture\' - Valid syntax: capture [var]';

class Capture extends Block {
  to: string;
  constructor(template: Template, tagName: string, markup: string) {
    super(template);
    this.tagName = tagName;
    const match = SYNTAX.exec(markup);
    if (match) {
      this.to = match[1];
    } else {
      throw new SyntaxError(SYNTAX_HELP);
    }
  }
  render(context: Context) {
    // const chunks = await super.render(context);
    // const output = Helpers.toFlatString(chunks);
    const output = super.render(context);
    context.lastScope().set(this.to, output);
    return '';
  }
}
export default Capture;
