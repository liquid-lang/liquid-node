const Liquid = require('../liquid')

const LITERALS = {
  empty: v => !((v != null ? v.length : void 0) > 0),
  blank: v => !v || v.toString().length === 0
}

const operators = {
  '==': (cond, left, right) => cond.equalVariables(left, right),
  'is': (cond, left, right) => cond.equalVariables(left, right),
  '!=': (cond, left, right) => !cond.equalVariables(left, right),
  '<>': (cond, left, right) => !cond.equalVariables(left, right),
  'isnt': (cond, left, right) => !cond.equalVariables(left, right),
  '<': (cond, left, right) => left < right,
  '>': (cond, left, right) => left > right,
  '<=': (cond, left, right) => left <= right,
  '>=': (cond, left, right) => left >= right,
  'contains': (cond, left, right) => {
    if (left == null) return
    if (typeof left.indexOf === 'function') return left.indexOf(right) >= 0
  }
}

class Condition {
  constructor (left, operator, right) {
    this.left = left
    this.operator = operator
    this.right = right
    this.childRelation = null
    this.childCondition = null
  }

  async evaluate (context = new Liquid.Context()) {
    const result = await this.interpretCondition(this.left, this.right, this.operator, context)
    switch (this.childRelation) {
      case 'or':
        return result || this.childCondition.evaluate(context)
      case 'and':
        return result && this.childCondition.evaluate(context)
      default:
        return result
    }
  }

  or (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'or'
    return this.childRelation
  }

  and (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'and'
    return this.childRelation
  }

  attach (attachment) {
    this.attachment = attachment
    return this.attachment
  }

  equalVariables (left, right) {
    if (typeof left === 'function') {
      return left(right)
    } else if (typeof right === 'function') {
      return right(left)
    } else {
      return left === right
    }
  }

  async resolveVariable (key, context) {
    if (key in LITERALS) {
      return LITERALS[key]
    } else {
      return context.get(key)
    }
  }

  async interpretCondition (left, right, op, context) {
    if (!op) {
      return this.resolveVariable(left, context)
    }

    const operation = Condition.operators[op]
    if (!operation) {
      throw new Error('Unknown operator ' + op)
    }

    const [resolvedLeft, resolvedRight] = await Promise.all([
      this.resolveVariable(left, context),
      this.resolveVariable(right, context)
    ])

    return operation(this, resolvedLeft, resolvedRight)
  }
}

Condition.operators = operators

module.exports = Condition
