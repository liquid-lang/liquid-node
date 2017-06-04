// @flow
import Block from '../block';
import Condition from '../condition';
import Context from '../context';
import ElseCondition from '../else_condition';
import PromiseReduce from '../../promise_reduce';
import { QuotedFragment } from '../regexps';
import Template from '../template';
import { scan } from '../helpers';

const SYNTAX_HELP = 'Syntax Error in tag \'if\' - Valid syntax: if [expression]';
const SYNTAX = RegExp(`(${QuotedFragment.source})\\s*([=!<>a-z_]+)?\\s*(${
  QuotedFragment.source})?`);
const eNo = `(?:\\b(?:\\s?and\\s?|\\s?or\\s?)\\b|(?:\\s*(?!\\b(?:\\s?and\\s?|\\s?or\\s?)\\b)(?:${
  QuotedFragment.source}|\\S+)\\s*)+)`;
const EXPRESSIONS_AND_OPERATORS = RegExp(eNo);

export default class If extends Block {
  internalBlocks: Condition[] = [];
  constructor(template: Template, tagName: string, markup: string) {
    super(template);
    this.tagName = tagName;
    this.blocks = [];
    this.pushBlock('if', markup);
  }
  get blocks(): Condition[] { return this.internalBlocks; }
  set blocks(blocks: Condition[]) { this.internalBlocks = blocks; }
  unknownTag(tag: string, markup: string) {
    if (['elsif', 'else'].includes(tag)) {
      return this.pushBlock(tag, markup);
    }
    return super.unknownTag(tag, [markup], []);
  }
  async render(context: Context) {
    async function stackReducer(chosenBlock: Condition, block: Condition) {
      if (chosenBlock != null) return chosenBlock;
      let ok = await block.evaluate(context);
      if (block.negate) ok = !ok;
      if (ok) return block;
      return null;
    }
    const block = await PromiseReduce(this.blocks, stackReducer, null);
    let stack = [''];
    if (block != null) {
      stack = await this.renderAll(block.attachment, context);
    }
    return context.stack(stack);
  }
  pushBlock(tag: string, markup: string) {
    const expressions = scan(markup, EXPRESSIONS_AND_OPERATORS).reverse();
    let match = SYNTAX.exec(expressions.shift());
    let condition: Condition;
    switch (tag) {
      case 'if':
      case 'elsif':
        if (match == null) {
          throw new SyntaxError(SYNTAX_HELP);
        }
        condition = new Condition(match[1], match[2], match[3]);
        while (expressions.length > 0) {
          const operator = String(expressions.shift()).trim();
          match = SYNTAX.exec(expressions.shift());
          if (match == null) {
            throw new SyntaxError(SYNTAX_HELP);
          }
          const newCondition: Condition = new Condition(match[1], match[2], match[3]);
        //   newCondition[operator].call(newCondition, condition);
          newCondition.OPERATORS.get(operator)(newCondition, condition);
          condition = newCondition;
        }
        this.blocks.push(condition);
        this.nodelist = condition.attach([]);
        break;
      case 'else':
        condition = new ElseCondition();
        this.blocks.push(condition);
        this.nodelist = condition.attach([]);
        break;
      default:
        this.unknownTag(tag, markup);
        break;
    }
  }
}
