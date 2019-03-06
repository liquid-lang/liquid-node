const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')

module.exports = (function (superClass) {
  var ExpressionsAndOperators, Syntax, SyntaxHelp

  extend(If, superClass)

  SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]"

  Syntax = RegExp('(' + Liquid.QuotedFragment.source + ')\\s*([=!<>a-z_]+)?\\s*(' + Liquid.QuotedFragment.source + ')?')

  ExpressionsAndOperators = RegExp('(?:\\b(?:\\s?and\\s?|\\s?or\\s?)\\b|(?:\\s*(?!\\b(?:\\s?and\\s?|\\s?or\\s?)\\b)(?:' + Liquid.QuotedFragment.source + '|\\S+)\\s*)+)')

  function If (template, tagName, markup) {
    this.blocks = []
    this.pushBlock('if', markup)
    If.__super__.constructor.apply(this, arguments)
  }

  If.prototype.unknownTag = function (tag, markup) {
    if (tag === 'elsif' || tag === 'else') {
      return this.pushBlock(tag, markup)
    } else {
      return If.__super__.unknownTag.apply(this, arguments)
    }
  }

  If.prototype.render = function (context) {
    return context.stack((function (_this) {
      return function () {
        return PromiseReduce(_this.blocks, function (chosenBlock, block) {
          if (chosenBlock != null) {
            return chosenBlock
          }
          return Promise.resolve().then(function () {
            return block.evaluate(context)
          }).then(function (ok) {
            if (block.negate) {
              ok = !ok
            }
            if (ok) {
              return block
            }
          })
        }, null).then(function (block) {
          if (block != null) {
            return _this.renderAll(block.attachment, context)
          } else {
            return ''
          }
        })
      }
    })(this))
  }

  If.prototype.pushBlock = function (tag, markup) {
    var block, condition, expressions, match, newCondition, operator
    block = (function () {
      if (tag === 'else') {
        return new Liquid.ElseCondition()
      } else {
        expressions = Liquid.Helpers.scan(markup, ExpressionsAndOperators)
        expressions = expressions.reverse()
        match = Syntax.exec(expressions.shift())
        if (!match) {
          throw new Liquid.SyntaxError(SyntaxHelp)
        }
        condition = (function (func, args, Ctor) {
          Ctor.prototype = func.prototype
          var child = new Ctor(); var result = func.apply(child, args)
          return Object(result) === result ? result : child
        })(Liquid.Condition, match.slice(1, 4), function () {})
        while (expressions.length > 0) {
          operator = String(expressions.shift()).trim()
          match = Syntax.exec(expressions.shift())
          if (!match) {
            throw new SyntaxError(SyntaxHelp)
          }
          newCondition = (function (func, args, Ctor) {
            Ctor.prototype = func.prototype
            var child = new Ctor(); var result = func.apply(child, args)
            return Object(result) === result ? result : child
          })(Liquid.Condition, match.slice(1, 4), function () {})
          newCondition[operator].call(newCondition, condition) // eslint-disable-line
          condition = newCondition
        }
        return condition
      }
    })()
    this.blocks.push(block)
    this.nodelist = block.attach([])
  }

  return If
})(Liquid.Block)
