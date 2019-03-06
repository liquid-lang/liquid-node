const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  extend(Increment, superClass)

  function Increment (template, tagName, markup) {
    this.variable = markup.trim()
    Increment.__super__.constructor.apply(this, arguments)
  }

  Increment.prototype.render = function (context) {
    var base, name, value
    value = (base = context.environments[0])[name = this.variable] != null ? base[name] : base[name] = 0
    context.environments[0][this.variable] = value + 1
    return String(value)
  }

  return Increment
})(Liquid.Tag)
