// @flow
// import Promise from 'any-promise';
import PromiseReduce from '../../promise_reduce';
import Block from '../block';
import { QuotedFragment } from '../regexps';
import { SyntaxError } from '../errors';
import ElseCondition from '../else_condition';
import { scan } from '../helpers';
import Condition from '../condition';


const SYNTAX_HELP = 'Syntax Error in tag \'case\' - Valid syntax: case [expression]';

const SYNTAX = RegExp(`(${QuotedFragment.source})`);
const WHEN_SYNTAX = RegExp(`(${
  QuotedFragment.source})(?:(?:\\s+or\\s+|\\s*\\,\\s*)(${QuotedFragment.source}))?`);

class Case extends Block {
  blocks: Condition[] = [];
  nodelist: any[] = [];
  constructor(template: Template, tagName: string, markup: string) {
    super(template);
    const match = SYNTAX.exec(markup);
    if (!match) {
      throw new SyntaxError(SYNTAX_HELP);
    }
    this.tagName = tagName;
    this.markup = markup;
  }
  unknownTag(tag: string, markup: string) {
    if (['when', 'else'].includes(tag)) {
      this.pushBlock(tag, markup);
    }
    super.unknownTag(tag, [markup].concat(''), null);
  }
  async render(context: Context) {
    const caseTag = this;
    async function stackReducer(chosenBlock: Condition, block: Condition) {
      if (chosenBlock != null) {
        return chosenBlock;
      }
      const ok = await block.evaluate(context);
      if (ok) {
        return block;
      }
      return null;
    }
    async function stack() {
      const block: Condition = await PromiseReduce(caseTag.blocks, stackReducer, null);
      if (block != null) {
        return caseTag.renderAll(block.attachment, context);
      }
      return '';
    }
    return context.stack(stack);
  }
  // private
  pushBlock(tag: string, markup: string) {
    let block: Condition;
    const nodelist: any[] = [];
    if (tag === 'else') {
      block = new ElseCondition();
      this.blocks.push(block);
      this.nodelist = block.attach([]);
    } else {
      const expressions = scan(markup, WHEN_SYNTAX);
      const caseTag = this;
      expressions[0].forEach((value: any) => {
        if (value) {
          block = new Condition(caseTag.markup, '==', value);
          caseTag.blocks.push(block);
          caseTag.nodelist = block.attach(nodelist);
        }
      });
    }
  }
}
export default Case;
