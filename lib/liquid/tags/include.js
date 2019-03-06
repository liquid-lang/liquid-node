const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')

module.exports = (function (superClass) {
  var Syntax, SyntaxHelp

  extend(Include, superClass)

  Syntax = /([a-z0-9/\\_-]+)/i

  SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]"

  function Include (template, tagName, markup, tokens) {
    var match
    match = Syntax.exec(markup)
    if (!match) {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    this.filepath = match[1]
    this.subTemplate = template.engine.fileSystem.readTemplateFile(this.filepath).then(function (src) {
      return template.engine.parse(src)
    })
    Include.__super__.constructor.apply(this, arguments)
  }

  Include.prototype.render = function (context) {
    return this.subTemplate.then(function (i) {
      return i.render(context)
    })
  }

  return Include
})(Liquid.Tag)
