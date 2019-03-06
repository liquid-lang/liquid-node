const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  extend(Raw, superClass)

  function Raw () {
    return Raw.__super__.constructor.apply(this, arguments)
  }

  Raw.prototype.parse = function (tokens) {
    return Promise.resolve().then((function (_this) {
      return function () {
        var match, token
        if (tokens.length === 0 || _this.ended) {
          return Promise.resolve()
        }
        token = tokens.shift()
        match = Liquid.Block.FullToken.exec(token.value)
        if ((match != null ? match[1] : void 0) === _this.blockDelimiter()) {
          return _this.endTag()
        }
        _this.nodelist.push(token.value)
        return _this.parse(tokens)
      }
    })(this))
  }

  return Raw
})(Liquid.Block)
