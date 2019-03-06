const slice = [].slice
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')

module.exports = (function () {
  function Context (engine, environments, outerScope, registers, rethrowErrors) {
    var ref
    if (environments == null) {
      environments = {}
    }
    if (outerScope == null) {
      outerScope = {}
    }
    if (registers == null) {
      registers = {}
    }
    if (rethrowErrors == null) {
      rethrowErrors = false
    }
    this.environments = Liquid.Helpers.flatten([environments])
    this.scopes = [outerScope]
    this.registers = registers
    this.errors = []
    this.rethrowErrors = rethrowErrors
    this.strainer = (ref = engine != null ? new engine.Strainer(this) : void 0) != null ? ref : {}
    this.squashInstanceAssignsWithEnvironments()
  }

  Context.prototype.registerFilters = function () {
    var filter, filters, i, k, len, v
    filters = arguments.length >= 1 ? slice.call(arguments, 0) : []
    for (i = 0, len = filters.length; i < len; i++) {
      filter = filters[i]
      for (k in filter) {
        if (!hasProp.call(filter, k)) continue
        v = filter[k]
        if (v instanceof Function) {
          this.strainer[k] = v
        }
      }
    }
  }

  Context.prototype.handleError = function (e) {
    this.errors.push(e)
    if (this.rethrowErrors) {
      throw e
    }
    if (e instanceof Liquid.SyntaxError) {
      return 'Liquid syntax error: ' + e.message
    } else {
      return 'Liquid error: ' + e.message
    }
  }

  Context.prototype.invoke = function () {
    var args, available, method, methodName
    methodName = arguments[0]
    args = arguments.length >= 2 ? slice.call(arguments, 1) : []
    method = this.strainer[methodName]
    if (method instanceof Function) {
      return method.apply(this.strainer, args)
    } else {
      available = Object.keys(this.strainer)
      throw new Liquid.FilterNotFound('Unknown filter `' + methodName + '`, available: [' + (available.join(', ')) + ']')
    }
  }

  Context.prototype.push = function (newScope) {
    if (newScope == null) {
      newScope = {}
    }
    this.scopes.unshift(newScope)
    if (this.scopes.length > 100) {
      throw new Error('Nesting too deep')
    }
  }

  Context.prototype.merge = function (newScope) {
    var k, results, v
    if (newScope == null) {
      newScope = {}
    }
    results = []
    for (k in newScope) {
      if (!hasProp.call(newScope, k)) continue
      v = newScope[k]
      results.push(this.scopes[0][k] = v)
    }
    return results
  }

  Context.prototype.pop = function () {
    if (this.scopes.length <= 1) {
      throw new Error('ContextError')
    }
    return this.scopes.shift()
  }

  Context.prototype.lastScope = function () {
    return this.scopes[this.scopes.length - 1]
  }

  Context.prototype.stack = function (newScope, f) {
    var popLater, result
    if (newScope == null) {
      newScope = {}
    }
    popLater = false
    try {
      if (arguments.length < 2) {
        f = newScope
        newScope = {}
      }
      this.push(newScope)
      result = f()
      if ((result != null ? result.nodeify : void 0) != null) {
        popLater = true
        result.nodeify((function (_this) {
          return function () {
            return _this.pop()
          }
        })(this))
      }
      return result
    } finally {
      if (!popLater) {
        this.pop()
      }
    }
  }

  Context.prototype.clearInstanceAssigns = function () {
    this.scopes[0] = {}
  }

  Context.prototype.set = function (key, value) {
    this.scopes[0][key] = value
  }

  Context.prototype.get = function (key) {
    return this.resolve(key)
  }

  Context.prototype.hasKey = function (key) {
    return Promise.resolve(this.resolve(key)).then(function (v) {
      return v != null
    })
  }

  Context.Literals = {
    'null': null,
    'nil': null,
    '': null,
    'true': true,
    'false': false
  }

  Context.prototype.resolve = function (key) {
    var hi, lo, match
    if (Liquid.Context.Literals.hasOwnProperty(key)) {
      return Liquid.Context.Literals[key]
    } else if (match = /^'(.*)'$/.exec(key)) { // eslint-disable-line
      return match[1]
    } else if (match = /^"(.*)"$/.exec(key)) { // eslint-disable-line
      return match[1]
    } else if (match = /^(\d+)$/.exec(key)) { // eslint-disable-line
      return Number(match[1])
    } else if (match = /^\((\S+)\.\.(\S+)\)$/.exec(key)) { // eslint-disable-line
      lo = this.resolve(match[1])
      hi = this.resolve(match[2])
      return Promise.all([lo, hi]).then(function (arg) {
        var hi, lo
        lo = arg[0]
        hi = arg[1]
        lo = Number(lo)
        hi = Number(hi)
        if (isNaN(lo) || isNaN(hi)) {
          return []
        }
        return new Liquid.Range(lo, hi + 1)
      })
    } else if (match = /^(\d[\d.]+)$/.exec(key)) { // eslint-disable-line
      return Number(match[1])
    } else {
      return this.variable(key)
    }
  }

  Context.prototype.findVariable = function (key) {
    var variable, variableScope
    variableScope = void 0
    variable = void 0
    this.scopes.some(function (scope) {
      if (scope.hasOwnProperty(key)) {
        variableScope = scope
        return true
      }
    })
    if (variableScope == null) {
      this.environments.some((function (_this) {
        return function (env) {
          variable = _this.lookupAndEvaluate(env, key)
          if (variable != null) {
            variableScope = env
            return variableScope
          }
        }
      })(this))
    }
    if (variableScope == null) {
      if (this.environments.length > 0) {
        variableScope = this.environments[this.environments.length - 1]
      } else if (this.scopes.length > 0) {
        variableScope = this.scopes[this.scopes.length - 1]
      } else {
        throw new Error('No scopes to find variable in.')
      }
    }
    if (variable == null) {
      variable = this.lookupAndEvaluate(variableScope, key)
    }
    return Promise.resolve(variable).then((function (_this) {
      return function (v) {
        return _this.liquify(v)
      }
    })(this))
  }

  Context.prototype.variable = function (markup) {
    return Promise.resolve().then((function (_this) {
      return function () {
        var firstPart, iterator, mapper, match, object, parts, squareBracketed
        parts = Liquid.Helpers.scan(markup, Liquid.VariableParser)
        squareBracketed = /^\[(.*)\]$/
        firstPart = parts.shift()
        match = squareBracketed.exec(firstPart)
        if (match) {
          firstPart = match[1]
        }
        object = _this.findVariable(firstPart)
        if (parts.length === 0) {
          return object
        }
        mapper = function (part, object) {
          if (object == null) {
            return Promise.resolve(object)
          }
          return Promise.resolve(object).then(_this.liquify.bind(_this)).then(function (object) {
            var bracketMatch
            if (object == null) {
              return object
            }
            bracketMatch = squareBracketed.exec(part)
            if (bracketMatch) {
              part = _this.resolve(bracketMatch[1])
            }
            return Promise.resolve(part).then(function (part) {
              var isArrayAccess, isObjectAccess, isSpecialAccess
              isArrayAccess = Array.isArray(object) && isFinite(part)
              isObjectAccess = object instanceof Object && ((typeof object.hasKey === 'function' ? object.hasKey(part) : void 0) || part in object)
              isSpecialAccess = !bracketMatch && object && (Array.isArray(object) || Object.prototype.toString.call(object) === '[object String]') && ['size', 'first', 'last'].indexOf(part) >= 0
              if (isArrayAccess || isObjectAccess) {
                return Promise.resolve(_this.lookupAndEvaluate(object, part)).then(_this.liquify.bind(_this))
              } else if (isSpecialAccess) {
                switch (part) {
                  case 'size':
                    return _this.liquify(object.length)
                  case 'first':
                    return _this.liquify(object[0])
                  case 'last':
                    return _this.liquify(object[object.length - 1])
                  default:

                    /* @covignore */
                    throw new Error('Unknown special accessor: ' + part)
                }
              }
            })
          })
        }
        iterator = function (object, index) {
          if (index < parts.length) {
            return mapper(parts[index], object).then(function (object) {
              return iterator(object, index + 1)
            })
          } else {
            return Promise.resolve(object)
          }
        }
        return iterator(object, 0)['catch'](function (err) {
          throw new Error("Couldn't walk variable: " + markup + ': ' + err)
        })
      }
    })(this))
  }

  Context.prototype.lookupAndEvaluate = function (obj, key) {
    if (obj instanceof Liquid.Drop) {
      return obj.get(key)
    } else {
      return obj != null ? obj[key] : void 0
    }
  }

  Context.prototype.squashInstanceAssignsWithEnvironments = function () {
    var lastScope
    lastScope = this.lastScope()
    return Object.keys(lastScope).forEach((function (_this) {
      return function (key) {
        return _this.environments.some(function (env) {
          if (env.hasOwnProperty(key)) {
            lastScope[key] = _this.lookupAndEvaluate(env, key)
            return true
          }
        })
      }
    })(this))
  }

  Context.prototype.liquify = function (object) {
    return Promise.resolve(object).then((function (_this) {
      return function (object) {
        if (object == null) {
          return object
        } else if (typeof object.toLiquid === 'function') {
          object = object.toLiquid()
        } else if (typeof object === 'object') {
          true // eslint-disable-line
        } else if (typeof object === 'function') {
          object = ''
        } else {
          Object.prototype.toString.call(object)
        }
        if (object instanceof Liquid.Drop) {
          object.context = _this
        }
        return object
      }
    })(this))
  }

  return Context
})()
