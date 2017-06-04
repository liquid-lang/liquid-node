// @flow
import Context from '../context';
import { SyntaxError } from '../errors';
import Tag from '../tag';
import Template from '../template';
import Variable from '../variable';
import { VariableSignature } from '../regexps';

class Assign extends Tag {
  to: string;
  from: Variable;
  static get SYNTAX_HELP() {
    return 'Syntax Error in \'assign\' - Valid syntax: assign [var] = [source]';
  }
  static get SYNTAX() {
    return RegExp(`((?:${VariableSignature.source})+)\\s*=\\s*(.*)\\s*`);
  }
  constructor(template: Template, tagName: string, markup: string) {
    super(template, tagName, markup);
    const match = Assign.SYNTAX.exec(markup);
    if (match) {
      this.to = match[1];
      this.from = new Variable(match[2]);
    } else {
      throw new SyntaxError(Assign.SYNTAX_HELP);
    }
  }
  render(context: Context) {
    context.lastScope().set(this.to, this.from.render(context));
    return super.render(context);
  }
}

export default Assign;
