const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')

module.exports = Liquid.Document = (function (superClass) {
  extend(Document, superClass)

  function Document (template) {
    this.template = template
  }

  Document.prototype.blockDelimiter = function () {
    return []
  }

  Document.prototype.assertMissingDelimitation = function () {}

  return Document
})(Liquid.Block)
