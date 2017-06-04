// @flow
import Context from './context';
import Template from './template';

class Tag {
  template: Template;
  tagName: string;
  markup: string;
  constructor(template: Template, tagName: string, markup: string) {
    this.template = template;
    this.tagName = tagName;
    this.markup = markup;
  }

  async parseWithCallbacks(...args: mixed[]) {
    if (this.beforeParse) {
      await this.beforeParse(...args);
    }
    this.parse(...args);
    if (this.afterParse) {
      await this.afterParse(...args);
    }
  }
  /* eslint-disable class-methods-use-this */
  async afterParse() { /* no-op */ }
  async beforeParse() { /* no-op */ }
  async parse() { return false; }
  /* eslint-disable no-unused-vars */
  async render(context: Context) {
    return '';
  }
  /* eslint-enable no-unused-vars */
  /* eslint-enable class-methods-use-this */
  name() {
    return this.constructor.name.toLowerCase();
  }
}

export default Tag;
