const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Raw = require('./raw')

module.exports = (function (superClass) {
  extend(Comment, superClass)

  function Comment () {
    return Comment.__super__.constructor.apply(this, arguments)
  }

  Comment.prototype.render = function () {
    return ''
  }

  return Comment
})(Raw)
