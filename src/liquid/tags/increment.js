// @flow
import Context from '../context';
import Tag from '../tag';
import Template from '../template';

/**
 * increment is used in a place where one needs to insert a counter
 *     into a template, and needs the counter to survive across
 *     multiple instantiations of the template.
 *     (To achieve the survival, the application must keep the context)
 *
 *     If the variable does not exist, it defaults to value 0.
 *
 *   Hello: {% increment variable %}
 *
 * gives you:
 *
 *    Hello: 0
 *    Hello: 1
 *    Hello: 2
 *
 * @class Increment
 */
class Increment extends Tag {
  variable: string;
  constructor(template: Template, tagName: string, markup: string) {
    super(template, tagName, markup);
    this.variable = markup.trim();
  }
  async render(context: Context) {
    const value = (context.environments[0].get(this.variable)) || 0;
    context.environments[0].set(this.variable, value + 1);
    return String(value);
  }
}

export default Increment;
