const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../../liquid')
const PromiseReduce = require('../../promise_reduce')
const Iterable = require('../iterable')

module.exports = (function (superClass) {
  var Syntax, SyntaxHelp

  extend(For, superClass)

  SyntaxHelp = "Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]"

  Syntax = RegExp('(\\w+)\\s+in\\s+((?:' + Liquid.QuotedFragment.source + ')+)\\s*(reversed)?')

  function For (template, tagName, markup) {
    var match
    match = Syntax.exec(markup)
    if (match) {
      this.variableName = match[1]
      this.collectionName = match[2]
      this.registerName = match[1] + '=' + match[2]
      this.reversed = match[3]
      this.attributes = {}
      Liquid.Helpers.scan(markup, Liquid.TagAttributes).forEach((function (_this) {
        return function (attr) {
          _this.attributes[attr[0]] = attr[1]
        }
      })(this))
    } else {
      throw new Liquid.SyntaxError(SyntaxHelp)
    }
    this.nodelist = this.forBlock = []
    For.__super__.constructor.apply(this, arguments)
  }

  For.prototype.unknownTag = function (tag, markup) {
    if (tag !== 'else') {
      return For.__super__.unknownTag.apply(this, arguments)
    }
    this.nodelist = this.elseBlock = []
    return this.nodelist
  }

  For.prototype.render = function (context) {
    var base;
    (base = context.registers)['for'] || (base['for'] = {})
    return Promise.resolve(context.get(this.collectionName)).then((function (_this) {
      return function (collection) {
        var from, k, limit, to, v
        if (collection != null ? collection.forEach : void 0) {

        } else if (collection instanceof Object) {
          collection = (function () {
            var results
            results = []
            for (k in collection) {
              if (!hasProp.call(collection, k)) continue
              v = collection[k]
              results.push([k, v])
            }
            return results
          })()
        } else {
          return _this.renderElse(context)
        }
        from = _this.attributes.offset === 'continue' ? Number(context.registers['for'][_this.registerName]) || 0 : Number(_this.attributes.offset) || 0
        limit = _this.attributes.limit
        to = limit ? Number(limit) + from : null
        return _this.sliceCollection(collection, from, to).then(function (segment) {
          var length
          if (segment.length === 0) {
            return _this.renderElse(context)
          }
          if (_this.reversed) {
            segment.reverse()
          }
          length = segment.length
          context.registers['for'][_this.registerName] = from + segment.length
          return context.stack(function () {
            return PromiseReduce(segment, function (output, item, index) {
              context.set(_this.variableName, item)
              context.set('forloop', {
                name: _this.registerName,
                length: length,
                index: index + 1,
                index0: index,
                rindex: length - index,
                rindex0: length - index - 1,
                first: index === 0,
                last: index === length - 1
              })
              return Promise.resolve().then(function () {
                return _this.renderAll(_this.forBlock, context)
              }).then(function (rendered) {
                output.push(rendered)
                return output
              })['catch'](function (e) {
                output.push(context.handleError(e))
                return output
              })
            }, [])
          })
        })
      }
    })(this))
  }

  For.prototype.sliceCollection = function (collection, from, to) {
    var args, ref
    args = [from]
    if (to != null) {
      args.push(to)
    }
    return (ref = Iterable.cast(collection)).slice.apply(ref, args)
  }

  For.prototype.renderElse = function (context) {
    if (this.elseBlock) {
      return this.renderAll(this.elseBlock, context)
    } else {
      return ''
    }
  }

  return For
})(Liquid.Block)
