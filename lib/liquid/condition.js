const Liquid = require('../liquid')

module.exports = (function () {
  var LITERALS

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
      return (left != null ? typeof left.indexOf === 'function' ? left.indexOf(right) : void 0 : void 0) >= 0
    }
  }

  function Condition (left1, operator, right1) {
    this.left = left1
    this.operator = operator
    this.right = right1
    this.childRelation = null
    this.childCondition = null
  }

  Condition.prototype.evaluate = function (context) {
    var result
    if (context == null) {
      context = new Liquid.Context()
    }
    result = this.interpretCondition(this.left, this.right, this.operator, context)
    switch (this.childRelation) {
      case 'or':
        return Promise.resolve(result).then((function (_this) {
          return function (result) {
            return result || _this.childCondition.evaluate(context)
          }
        })(this))
      case 'and':
        return Promise.resolve(result).then((function (_this) {
          return function (result) {
            return result && _this.childCondition.evaluate(context)
          }
        })(this))
      default:
        return result
    }
  }

  Condition.prototype.or = function (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'or'
    return this.childRelation
  }

  Condition.prototype.and = function (childCondition) {
    this.childCondition = childCondition
    this.childRelation = 'and'
    return this.childRelation
  }

  Condition.prototype.attach = function (attachment) {
    this.attachment = attachment
    return this.attachment
  }

  Condition.prototype.equalVariables = function (left, right) {
    if (typeof left === 'function') {
      return left(right)
    } else if (typeof right === 'function') {
      return right(left)
    } else {
      return left === right
    }
  }

  LITERALS = {
    empty: function (v) {
      return !((v != null ? v.length : void 0) > 0)
    },
    blank: function (v) {
      return !v || v.toString().length === 0
    }
  }

  Condition.prototype.resolveVariable = function (v, context) {
    if (v in LITERALS) {
      return Promise.resolve(LITERALS[v])
    } else {
      return context.get(v)
    }
  }

  Condition.prototype.interpretCondition = function (left, right, op, context) {
    var operation
    if (op == null) {
      return this.resolveVariable(left, context)
    }
    operation = Condition.operators[op]
    if (operation == null) {
      throw new Error('Unknown operator ' + op)
    }
    left = this.resolveVariable(left, context)
    right = this.resolveVariable(right, context)
    return Promise.all([left, right]).then((function (_this) {
      return function (arg) {
        var left, right
        left = arg[0]
        right = arg[1]
        return operation(_this, left, right)
      }
    })(this))
  }

  return Condition
})()
