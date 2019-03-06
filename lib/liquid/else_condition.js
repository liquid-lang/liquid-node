const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')

module.exports = (function (superClass) {
  extend(ElseCondition, superClass)

  function ElseCondition () {
    return ElseCondition.__super__.constructor.apply(this, arguments)
  }

  ElseCondition.prototype.evaluate = function () {
    return true
  }

  return ElseCondition
})(Liquid.Condition)
