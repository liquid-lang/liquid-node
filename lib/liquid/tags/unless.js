const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  extend(Unless, superClass)

  function Unless () {
    return Unless.__super__.constructor.apply(this, arguments)
  }

  Unless.prototype.parse = function () {
    return Unless.__super__.parse.apply(this, arguments).then((function (_this) {
      return function () {
        _this.blocks[0].negate = true
      }
    })(this))
  }

  return Unless
})(Liquid.If)
