const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  extend(Decrement, superClass)

  function Decrement (template, tagName, markup) {
    this.variable = markup.trim()
    Decrement.__super__.constructor.apply(this, arguments)
  }

  Decrement.prototype.render = function (context) {
    var base, name, value
    value = (base = context.environments[0])[name = this.variable] || (base[name] = 0)
    value = value - 1
    context.environments[0][this.variable] = value
    return value.toString()
  }

  return Decrement
})(Liquid.Tag)
