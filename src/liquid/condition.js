import Context from './context'

const LITERALS = {
  empty (v) {
    return !((v != null ? v.length : void 0) > 0)
  },
  blank (v) {
    return !v || v.toString().length === 0
  }
}

class Condition {
  constructor (left1, operator, right1) {
    this.left = left1
    this.operator = operator
    this.right = right1
    this.childRelation = null
    this.childCondition = null
  }

  evaluate (context = new Context()) {
    const result = this.interpretCondition(this.left, this.right, this.operator, context)
    switch (this.childRelation) {
      case 'or':
        return Promise.resolve(result).then(((_this => result => result || _this.childCondition.evaluate(context)))(this))
      case 'and':
        return Promise.resolve(result).then(((_this => result => result && _this.childCondition.evaluate(context)))(this))
      default:
        return result
    }
  }

  or (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'or'
  }

  and (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'and'
  }

  attach (attachment) {
    this.attachment = attachment
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

  resolveVariable (v, context) {
    if (v in LITERALS) {
      return Promise.resolve(LITERALS[v])
    } else {
      return context.get(v)
    }
  }

  interpretCondition (left, right, op, context) {
    if (op == null) {
      return this.resolveVariable(left, context)
    }
    const operation = Condition.operators[op]
    if (operation == null) {
      throw new Error(`Unknown operator ${op}`)
    }
    left = this.resolveVariable(left, context)
    right = this.resolveVariable(right, context)
    return Promise.all([left, right]).then(((_this => arg => {
      const left = arg[0]
      const right = arg[1]
      return operation(_this, left, right)
    }))(this))
  }
}

Condition.operators = {
  '==': function (cond, left, right) {
    return cond.equalVariables(left, right)
  },
  'is': function (cond, left, right) {
    return cond.equalVariables(left, right)
  },
  '!=': function (cond, left, right) {
    return !cond.equalVariables(left, right)
  },
  '<>': function (cond, left, right) {
    return !cond.equalVariables(left, right)
  },
  'isnt': function (cond, left, right) {
    return !cond.equalVariables(left, right)
  },
  '<': function (cond, left, right) {
    return left < right
  },
  '>': function (cond, left, right) {
    return left > right
  },
  '<=': function (cond, left, right) {
    return left <= right
  },
  '>=': function (cond, left, right) {
    return left >= right
  },
  'contains': function (cond, left, right) {
    return (left != null ? typeof left.includes === 'function' ? left.includes(right) : void 0 : void 0)
  }
}

export default Condition
