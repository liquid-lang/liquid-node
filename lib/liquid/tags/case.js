const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')

module.exports = (function (superClass) {
  extend(Case, superClass)

  const SyntaxHelp = "Syntax Error in tag 'case' - Valid syntax: case [expression]"
  const Syntax = RegExp('(' + Liquid.QuotedFragment.source + ')')
  const WhenSyntax = RegExp('(' + Liquid.QuotedFragment.source + ')(?:(?:\\s+or\\s+|\\s*\\,\\s*)(' + Liquid.QuotedFragment.source + '))?')

  function Case (template, tagName, markup) {
    var match
    this.blocks = []
    match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    this.markup = markup
    Case.__super__.constructor.apply(this, arguments)
  }

  Case.prototype.unknownTag = function (tag, markup) {
    if (tag === 'when' || tag === 'else') {
      return this.pushBlock(tag, markup)
    } else {
      return Case.__super__.unknownTag.apply(this, arguments)
    }
  }

  Case.prototype.render = function (context) {
    return context.stack((function (_this) {
      return function () {
        return PromiseReduce(_this.blocks, function (chosenBlock, block) {
          if (chosenBlock != null) {
            return chosenBlock
          }
          return Promise.resolve().then(function () {
            return block.evaluate(context)
          }).then(function (ok) {
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

  Case.prototype.pushBlock = function (tag, markup) {
    var block, expressions, i, len, nodelist, ref, results, value
    if (tag === 'else') {
      block = new Liquid.ElseCondition()
      this.blocks.push(block)
      this.nodelist = block.attach([])
      return this.nodelist
    } else {
      expressions = Liquid.Helpers.scan(markup, WhenSyntax)
      nodelist = []
      ref = expressions[0]
      results = []
      for (i = 0, len = ref.length; i < len; i++) {
        value = ref[i]
        if (value) {
          block = new Liquid.Condition(this.markup, '==', value)
          this.blocks.push(block)
          results.push(this.nodelist = block.attach(nodelist))
        } else {
          results.push(void 0)
        }
      }
      return results
    }
  }

  return Case
})(Liquid.Block)
