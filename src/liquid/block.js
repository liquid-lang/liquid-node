// @flow

import { TagEnd, TagStart, VariableEnd, VariableStart } from './regexps';

import Context from './context';
import { SyntaxError } from './errors';
import Tag from './tag';
import Template from './template';
import type { Token } from './helpers';
import Variable from './variable';

async function promiseEach(promises: Promise<Tag>[], cb: Function) {
  const iterator = async (index: number) => {
    if (index >= promises.length) return;
    const value = await promises[index];
    await cb(value);
    iterator(index + 1);
  };
  return iterator(0);
}
/*
const promiseEach = (promises: Promise<Tag>[], cb: Function) => {
  const iterator = async (index: number): Promise<string[]> => {
    if (index >= promises.length) {
      return;
    }

    const promise = promises[index];
    return Promise.resolve(promise)
    .then(value => Promise.resolve(cb(value))
    .then(() => iterator(index + 1)));
  };
  return iterator(0);
};
*/

/**
 * Generic Blocks
 */
class Block extends Tag {
  ended: boolean;
  nodelist: any[];
  template: Template;
  tagName: string;
  static isTag = RegExp(`^${TagStart.source}`);
  static isVariable = RegExp(`^${VariableStart.source}`);
  static fullToken = RegExp(`^${TagStart.source}\\s*(\\w+)\\s*(.*)?${TagEnd.source}$`);
  static contentOfVariable = RegExp(`^${VariableStart.source}(.*)${VariableEnd.source}$`);
  async afterParse() {
    return this.assertMissingDelimitation();
  }
  async assertMissingDelimitation() {
    if (!this.ended) {
      throw new SyntaxError(`${this.blockName()} tag was never closed`);
    }
  }
  async beforeParse() {
    this.nodelist = [];
  }
  blockDelimiter() {
    return `end${this.blockName()}`;
  }
  blockName() {
    return this.tagName;
  }
  constructor(template: Template) {
    super(template, '', '');
    this.template = template;
  }
  endTag() {
    this.ended = true;
    return true;
  }

//   parse(...tokens: Token[]) {
//     if (tokens.length === 0 || this.ended) {
//       return Promise.resolve();
//     }
//     const self = this;
//     const token = tokens.shift();
//     return Promise.resolve()
//     .then(() => self.parseToken(token as Token, tokens))
//     .catch((e) => {
//       if (token) {
//         e.message = `${e.message}\n    at ${
//           token.value} (${token.filename}:${token.line}:${token.col})`;
//         if (e.location == null) {
//           const { col, line, filename } = token;
//           e.location = {
//             col,
//             line,
//             filename,
//           };
//         }
//       }
//       throw e;
//     }).then(() => self.parse(...tokens));
//   }

  async parse(...tokens: Token[]) {
    if (tokens.length === 0 || this.ended) {
      return true;
    }
    const token = tokens.shift();
    let ok = true;
    try {
      if (token) {
        this.parseToken(token, tokens);
      }
    } catch (e) {
      if (token) {
        e.message = `${e.message}\n    at ${
          token.value} (${token.filename}:${token.line}:${token.col})`;
        if (e.location == null) {
          const { col, line, filename } = token;
          e.location = {
            col,
            line,
            filename,
          };
        }
      }
      ok = false;
      throw e;
    } finally {
      await this.parse(...tokens);
      return ok;
    }
  }
  createVariable(token: Token) {
    let match;
    if (Block.contentOfVariable.test(token.value)) {
      match = Block.contentOfVariable.exec(token.value);
    }
    if (match) {
      return new Variable(match[1]);
    }

    throw new SyntaxError(`Variable ${
        token.value}' was not properly terminated with regexp: ${VariableEnd.source}`);
  }
  async parseToken(token: Token, tokens: Token[]) {
    if (Block.isTag.test(token.value)) {
      const match = Block.fullToken.exec(token.value);
      if (!match) {
        throw new SyntaxError(`Tag '${
          token.value}' was not properly terminated with regexp: ${TagEnd.source}`);
      }
      if (this.blockDelimiter() === match[1]) {
        return this.endTag();
      }
      const [_, tagName, markup] = match;
      console.info(_);
      if (this.template.tags.get(tagName)) {
        const tag = new (this.template.tags.get(tagName))(this.template, tagName, markup);
        this.nodelist.push(tag);
        return tag.parseWithCallbacks(tokens);
      }
      return this.unknownTag(tagName, [markup], tokens);
    } else if (Block.isVariable.test(token.value)) {
      return this.nodelist.push(this.createVariable(token));
    } else if (token.value.length === 0) {
      // eslint disable-line no
    } else {
      return this.nodelist.push(token.value);
    }
  }

  async render(context: Context) {
    return (await this.renderAll(this.nodelist, context)).join('');
  }
/*
  renderAll(list: Promise<Tag>[] , context: Context) {
    const accumulator: string[] = [];
    return promiseEach(list, (token:Tag|string) => {
      if (!(token instanceof Tag)) {
        accumulator.push(token);
        return;
      }
      return Promise.resolve()
      .then(() => token.render(context))
      .then(s => accumulator.push(s), e => accumulator.push(context.handleError(e)));
    }).then(() => accumulator);
  }
*/
  async renderAll(list: Promise<Tag>[], context: Context): Promise<string[]> {
    const accumulator: string[] = [];
    return promiseEach(list, async (token: Tag | string) => {
      if (!(token instanceof Tag)) {
        accumulator.push(token);
        return;
      }
      try {
        const str = await token.render(context);
        accumulator.push(str);
      } catch (error) {
        accumulator.push(context.handleError(error));
      } finally {
        return accumulator;
      }
    });
  }
  unknownTag(tag: string, params: any[], tokens: Token[]) {
    console.error(`${this.name}: unknownTag() called with {params: "${
      params}", tokens: "${tokens}"}`);
    if (tag === 'else') {
      throw new SyntaxError(`${this.blockName()} tag does not expect else tag`);
    }
    if (tag === 'end') {
      throw new SyntaxError(`'end' is not a valid delimiter for ${
        this.blockName()} tags. use ${this.blockDelimiter()}`);
    }
    throw new SyntaxError(`Unknown tag '${tag}'`);
  }
}

export default Block;

