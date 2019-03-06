const hasProp = {}.hasOwnProperty
const slice = [].slice
const Liquid = require('../liquid')

module.exports = Liquid.Engine = (function () {
  function Engine () {
    var isBlockOrTagBaseClass, isSubclassOf, tag, tagName
    this.tags = {}
    this.Strainer = function (context) {
      this.context = context
    }
    this.registerFilters(Liquid.StandardFilters)
    this.fileSystem = new Liquid.BlankFileSystem()
    isSubclassOf = function (klass, ofKlass) {
      var ref
      if (typeof klass !== 'function') {
        return false
      } else if (klass === ofKlass) {
        return true
      } else {
        return isSubclassOf((ref = klass.__super__) != null ? ref.constructor : void 0, ofKlass)
      }
    }
    for (tagName in Liquid) {
      if (!hasProp.call(Liquid, tagName)) continue
      tag = Liquid[tagName]
      if (!isSubclassOf(tag, Liquid.Tag)) {
        continue
      }
      isBlockOrTagBaseClass = [Liquid.Tag, Liquid.Block].indexOf(tag.constructor) >= 0
      if (!isBlockOrTagBaseClass) {
        this.registerTag(tagName.toLowerCase(), tag)
      }
    }
  }

  Engine.prototype.registerTag = function (name, tag) {
    this.tags[name] = tag
  }

  Engine.prototype.registerFilters = function () {
    var filters
    filters = arguments.length >= 1 ? slice.call(arguments, 0) : []
    return filters.forEach((function (_this) {
      return function (filter) {
        var k, results, v
        results = []
        for (k in filter) {
          if (!hasProp.call(filter, k)) continue
          v = filter[k]
          if (v instanceof Function) {
            results.push(_this.Strainer.prototype[k] = v)
          } else {
            results.push(void 0)
          }
        }
        return results
      }
    })(this))
  }

  Engine.prototype.parse = function (source) {
    var template
    template = new Liquid.Template()
    return template.parse(this, source)
  }

  Engine.prototype.parseAndRender = function () {
    var source = arguments[0]
    var args = arguments.length >= 2 ? slice.call(arguments, 1) : []
    return this.parse(source).then(function (template) {
      return template.render.apply(template, args)
    })
  }

  Engine.prototype.registerFileSystem = function (fileSystem) {
    if (!(fileSystem instanceof Liquid.BlankFileSystem)) {
      throw Liquid.ArgumentError('Must be subclass of Liquid.BlankFileSystem')
    }
    this.fileSystem = fileSystem
    return this.fileSystem
  }

  return Engine
})()
