const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')

const promiseEach = function (promises, cb) {
  var iterator
  iterator = function (index) {
    var promise
    if (index >= promises.length) {
      return Promise.resolve()
    }
    promise = promises[index]
    return Promise.resolve(promise).then(function (value) {
      return Promise.resolve(cb(value)).then(function () {
        return iterator(index + 1)
      })
    })
  }
  return iterator(0)
}

module.exports = (function (superClass) {
  extend(Block, superClass)

  function Block () {
    return Block.__super__.constructor.apply(this, arguments)
  }

  Block.IsTag = RegExp('^' + Liquid.TagStart.source)

  Block.IsVariable = RegExp('^' + Liquid.VariableStart.source)

  Block.FullToken = RegExp('^' + Liquid.TagStart.source + '\\s*(\\w+)\\s*(.*)?' + Liquid.TagEnd.source + '$')

  Block.ContentOfVariable = RegExp('^' + Liquid.VariableStart.source + '(.*)' + Liquid.VariableEnd.source + '$')

  Block.prototype.beforeParse = function () {
    if (this.nodelist == null) {
      this.nodelist = []
    }
    this.nodelist.length = 0
    return this.nodelist.length
  }

  Block.prototype.afterParse = function () {
    return this.assertMissingDelimitation()
  }

  Block.prototype.parse = function (tokens) {
    var token
    if (tokens.length === 0 || this.ended) {
      return Promise.resolve()
    }
    token = tokens.shift()
    return Promise.resolve().then((function (_this) {
      return function () {
        return _this.parseToken(token, tokens)
      }
    })(this))['catch'](function (e) {
      e.message = e.message + '\n    at ' + token.value + ' (' + token.filename + ':' + token.line + ':' + token.col + ')'
      if (e.location == null) {
        e.location = {
          col: token.col,
          line: token.line,
          filename: token.filename
        }
      }
      throw e
    }).then((function (_this) {
      return function () {
        return _this.parse(tokens)
      }
    })(this))
  }

  Block.prototype.parseToken = function (token, tokens) {
    var Tag, match, tag
    if (Block.IsTag.test(token.value)) {
      match = Block.FullToken.exec(token.value)
      if (!match) {
        throw new Liquid.SyntaxError("Tag '" + token.value + "' was not properly terminated with regexp: " + Liquid.TagEnd.inspect)
      }
      if (this.blockDelimiter() === match[1]) {
        return this.endTag()
      }
      Tag = this.template.tags[match[1]]
      if (!Tag) {
        return this.unknownTag(match[1], match[2], tokens)
      }
      tag = new Tag(this.template, match[1], match[2])
      this.nodelist.push(tag)
      return tag.parseWithCallbacks(tokens)
    } else if (Block.IsVariable.test(token.value)) {
      return this.nodelist.push(this.createVariable(token))
    } else if (token.value.length === 0) {

    } else {
      return this.nodelist.push(token.value)
    }
  }

  Block.prototype.endTag = function () {
    this.ended = true
    return this.ended
  }

  Block.prototype.unknownTag = function (tag, params, tokens) {
    if (tag === 'else') {
      throw new Liquid.SyntaxError((this.blockName()) + ' tag does not expect else tag')
    } else if (tag === 'end') {
      throw new Liquid.SyntaxError("'end' is not a valid delimiter for " + (this.blockName()) + ' tags. use ' + (this.blockDelimiter()))
    } else {
      throw new Liquid.SyntaxError("Unknown tag '" + tag + "'")
    }
  }

  Block.prototype.blockDelimiter = function () {
    return 'end' + (this.blockName())
  }

  Block.prototype.blockName = function () {
    return this.tagName
  }

  Block.prototype.createVariable = function (token) {
    var match, ref
    match = (ref = Liquid.Block.ContentOfVariable.exec(token.value)) != null ? ref[1] : void 0
    if (match) {
      return new Liquid.Variable(match)
    }
    throw new Liquid.SyntaxError("Variable '" + token.value + "' was not properly terminated with regexp: " + Liquid.VariableEnd.inspect)
  }

  Block.prototype.render = function (context) {
    return this.renderAll(this.nodelist, context)
  }

  Block.prototype.assertMissingDelimitation = function () {
    if (!this.ended) {
      throw new Liquid.SyntaxError((this.blockName()) + ' tag was never closed')
    }
  }

  Block.prototype.renderAll = function (list, context) {
    var accumulator
    accumulator = []
    return promiseEach(list, function (token) {
      if (typeof (token != null ? token.render : void 0) !== 'function') {
        accumulator.push(token)
        return
      }
      return Promise.resolve().then(function () {
        return token.render(context)
      }).then(function (s) {
        return accumulator.push(s)
      }, function (e) {
        return accumulator.push(context.handleError(e))
      })
    }).then(function () {
      return accumulator
    })
  }

  return Block
})(Liquid.Tag)
