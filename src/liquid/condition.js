// @flow
import Context from './context';
import Engine from './engine';

class Condition {

  static LITERALS: Map<string, ((v: any) => boolean)> = new Map([
    ['empty', (v: any) => {
      if (v == null) return true;
      return !(v.length > 0);
    }],
  ['blank', (v: any) => !v || v.toString().length === 0],
  ]);
  // tslint:disable-next-line:max-line-length
  static OPERATORS: Map<string, ((left: any, right: any) => boolean)> = new Map([
  ['==', (left: any, right: any) => Condition.equalVariables(left, right)],
  ['is', (left: any, right: any) => Condition.equalVariables(left, right)],
  ['!=', (left: any, right: any) => !Condition.equalVariables(left, right)],
  ['<>', (left: any, right: any) => !Condition.equalVariables(left, right)],
  ['isnt', (left: any, right: any) => !Condition.equalVariables(left, right)],
  ['<', (left: any, right: any) => left < right],
  ['>', (left: any, right: any) => left > right],
  ['<=', (left: any, right: any) => left <= right],
  ['>=', (left: any, right: any) => left >= right],
    ['contains', (left: any[], right: any) => {
      if (left != null) {
        if (typeof left.includes === 'function') {
          return left.includes(right);
        }
        if (typeof left.indexOf === 'function') {
          return left.indexOf(right) !== -1;
        }
        return false;
      }
      return false;
    }],
  ]);

  internalAttachment: any;
  childCondition: Condition;
  childRelation: string = '';
  left: any;
  operator: string;
  right: any;
  negate: boolean = false;
  constructor(left1: any, operator: string, right1: any) {
    this.left = left1;
    this.operator = operator;
    this.right = right1;
  }

  async evaluate(context: Context = new Context(new Engine())): Promise<boolean> {
    const result = await this.interpretCondition(this.left, this.right, this.operator, context);
    switch (this.childRelation) {
      case 'or':
        return result || this.childCondition.evaluate(context);
      case 'and':
        return result && this.childCondition.evaluate(context);
      default:
        return result;
    }
  }
  get attachment(): any {
    return this.internalAttachment;
  }
  set attachment(v: any) {
    this.internalAttachment = v;
  }

  or(childCondition: Condition) {
    this.childCondition = childCondition;
    this.childRelation = 'or';
  }

  and(childCondition: Condition) {
    this.childCondition = childCondition;
    this.childRelation = 'and';
  }

  attach(attachment: any) {
    this.internalAttachment = attachment;
    return this.internalAttachment;
  }

  static equalVariables(left: any, right: any): boolean {
    if (typeof left === 'function') {
      return left(right);
    } else if (typeof right === 'function') {
      return right(left);
    }
    return left === right;
  }

  async resolveVariable(v: string, context: Context) {
    if (Condition.LITERALS.has(v)) {
      return Condition.LITERALS.get(v);
    }
    return context.get(v);
  }

  async interpretCondition(left: string, right: string, op: string, context: Context) {
    if (op == null) {
      return !!(await this.resolveVariable(left, context));
    }
    const operation = Condition.OPERATORS.get(op);
    if (operation == null) {
      throw new Error(`Unknown operator ${op}`);
    }
    const lhs = await this.resolveVariable(left, context);
    const rhs = await this.resolveVariable(right, context);
    return operation(lhs, rhs);
  }
}

export default Condition;
