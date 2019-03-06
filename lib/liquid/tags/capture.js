const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  var Syntax, SyntaxHelp

  extend(Capture, superClass)

  Syntax = /(\w+)/

  SyntaxHelp = "Syntax Error in 'capture' - Valid syntax: capture [var]"

  function Capture (template, tagName, markup) {
    var match
    match = Syntax.exec(markup)
    if (match) {
      this.to = match[1]
    } else {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    Capture.__super__.constructor.apply(this, arguments)
  }

  Capture.prototype.render = function (context) {
    return Capture.__super__.render.apply(this, arguments).then((function (_this) {
      return function (chunks) {
        var output
        output = Liquid.Helpers.toFlatString(chunks)
        context.lastScope()[_this.to] = output
        return ''
      }
    })(this))
  }

  return Capture
})(Liquid.Block)
