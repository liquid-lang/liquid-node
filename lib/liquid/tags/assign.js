const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  var Syntax, SyntaxHelp

  extend(Assign, superClass)

  SyntaxHelp = "Syntax Error in 'assign' - Valid syntax: assign [var] = [source]"

  Syntax = RegExp('((?:' + Liquid.VariableSignature.source + ')+)\\s*=\\s*(.*)\\s*')

  function Assign (template, tagName, markup) {
    var match = Syntax.exec(markup)
    if (match) {
      this.to = match[1]
      this.from = new Liquid.Variable(match[2])
    } else {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    Assign.__super__.constructor.apply(this, arguments)
  }

  Assign.prototype.render = function (context) {
    context.lastScope()[this.to] = this.from.render(context)
    return Assign.__super__.render.call(this, context)
  }

  return Assign
})(Liquid.Tag)
