Liquid = require "../liquid"

# Container for liquid nodes which conveniently wraps decision making logic
#
# Example:
#
#   c = Condition.new('1', '==', '1')
#   c.evaluate #=> true
#
module.exports = class Condition
  @operators =
    '==':       (cond, left, right) ->  cond.equalVariables(left, right)
    'is':       (cond, left, right) ->  cond.equalVariables(left, right)
    '!=':       (cond, left, right) -> !cond.equalVariables(left, right)
    '<>':       (cond, left, right) -> !cond.equalVariables(left, right)
    'isnt':     (cond, left, right) -> !cond.equalVariables(left, right)
    '<':        (cond, left, right) -> left < right
    '>':        (cond, left, right) -> left > right
    '<=':       (cond, left, right) -> left <= right
    '>=':       (cond, left, right) -> left >= right
    'contains': (cond, left, right) -> left?.indexOf?(right) >= 0

  constructor: (@left, @operator, @right) ->
    @childRelation = null
    @childCondition = null

  evaluate: (context) ->
    context ?= new Liquid.Context()

    result = @interpretCondition(@left, @right, @operator, context)

    switch @childRelation
      when "or"
        Promise.resolve(result).then (result) =>
          result or @childCondition.evaluate(context)
      when "and"
        Promise.resolve(result).then (result) =>
          result and @childCondition.evaluate(context)
      else
        result

  or: (@childCondition) ->
    @childRelation = "or"

  and: (@childCondition) ->
    @childRelation = "and"

  # Returns first agument
  attach: (attachment) ->
    @attachment = attachment

  # private API

  equalVariables: (left, right) ->
    if typeof left is "function"
      left right
    else if typeof right is "function"
      right left
    else
      left is right

  LITERALS =
    empty: (v) -> not (v?.length > 0) # false for non-collections
    blank: (v) -> !v or v.toString().length is 0

  resolveVariable: (v, context) ->
    if v of LITERALS
      Promise.resolve LITERALS[v]
    else
      context.get v

  interpretCondition: (left, right, op, context) ->
    # If the operator is empty this means that the decision statement is just
    # a single variable. We can just poll this variable from the context and
    # return this as the result.
    return @resolveVariable(left, context) unless op?

    operation = Condition.operators[op]
    throw new Error("Unknown operator #{op}") unless operation?

    left = @resolveVariable left, context
    right = @resolveVariable right, context

    Promise.all([left, right]).then ([left, right]) =>
      operation @, left, right
