const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  extend(IfChanged, superClass)

  function IfChanged () {
    return IfChanged.__super__.constructor.apply(this, arguments)
  }

  IfChanged.prototype.render = function (context) {
    return context.stack((function (_this) {
      return function () {
        var rendered
        rendered = _this.renderAll(_this.nodelist, context)
        return Promise.resolve(rendered).then(function (output) {
          output = Liquid.Helpers.toFlatString(output)
          if (output !== context.registers.ifchanged) {
            context.registers.ifchanged = output
            return context.registers.ifchanged
          } else {
            return ''
          }
        })
      }
    })(this))
  }

  return IfChanged
})(Liquid.Block)
