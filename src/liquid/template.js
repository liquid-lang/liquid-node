// @flow
import Context from './context';
import Document from './document';
import Engine from './engine';
import Tag from './tag';
import { TemplateParser } from './regexps';

export default class Template {
  engine: Engine;
  registers: Map<string, object> = new Map();
  assigns: Map<string, object> = new Map();
  root: any; // actually Document, but may be causing a dep circle
  instanceAssigns: Map<string, any> = new Map();

  errors: Error[] = [];
  rethrowErrors = true;

  tags: Map<string, Tag> = new Map();

  constructor() {
    this.engine = new Engine();
  } 
  /**
   * Parse source code
   * @param  {Engine} engine      The engine to run on
   * @param  {String} [source=''] the source code to run through the engine
   * @return {this}               returns `this` for easy chaining
   */
  async parse(engine: Engine, source = '') {
    this.engine = engine;
    this.root = new Document(this);
    this.tags = this.engine.tags;
    const tokens = Template.tokenize(source);
    await this.root.parseWithCallbacks(...tokens);
    return this;
  }
  /**
   * Uses the <tt>Liquid::TemplateParser</tt> regexp to tokenize the passed source
   * @param  {String} source The source to tokenize
   * @return {Token[]}
   */
  static tokenize(src: string) {
    const source = String(src);
    if (source.length === 0) {
      return [];
    }
    const tokens = source.split(TemplateParser);

    let line = 1;
    let col = 1;

    return tokens.filter(token => token.length > 0)
      .map((value) => {
        const result = { value, col, line };
        if (!value.includes('\n')) {
          col += value.length;
        } else {
          const linebreaks = value.split('\n').length - 1;
          line += linebreaks;
          col = value.length - value.lastIndexOf('\n');
        }
        return result;
      });
  }
  async render(...args: any[]) {
    return this.internalRender(...args);
  }
  async internalRender({ assigns, options }: { assigns: any, options: any }
                    = { assigns: null, options: null }) {
    if (!(this.root instanceof Document)) {
      throw new Error('No document root. Did you parse the document yet?');
    }
    const self = this;
    let context: Context;
    if (assigns instanceof Context) {
      context = assigns;
    } else if (assigns instanceof Object) {
      const tmpAssigns = [assigns, this.assigns];
      context = new Context(this.engine, tmpAssigns, this.instanceAssigns,
                            this.registers, this.rethrowErrors);
    } else if (assigns == null) {
      context = new Context(this.engine, [this.assigns], this.instanceAssigns,
                            this.registers, this.rethrowErrors);
    } else {
      throw new Error(`Expected Object or Liquid::Context as parameter, but was ${
          typeof assigns}.`);
    }
    if (options != null) {
      if (options.registers) {
        Object.entries(options.registers).map(([k, v]) => self.registers.set(k, v));
      }
      if (options.filters) {
        context.registerFilters(options.filters);
      }
    }
    try {
      const result = await this.root.render(context);
      return this.copyErrors(result, context);
    } catch (error) {
      this.errors = context.errors;
      throw error;
    }
  }
  copyErrors(actualResult: string, context: Context) {
    this.errors = context.errors;
    return actualResult;
  }
}

