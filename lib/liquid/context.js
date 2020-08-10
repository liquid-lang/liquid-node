const Liquid = require('../liquid')
const squareBracketed = /^\[(.*)\]$/

class Context {
  constructor (
    engine,
    environments = {},
    outerScope = {},
    registers = {},
    rethrowErrors = false
  ) {
    this.environments = Liquid.Helpers.flatten([environments])
    this.scopes = [outerScope]
    this.registers = registers
    this.errors = []
    this.rethrowErrors = rethrowErrors
    this.strainer = engine ? new engine.Strainer(this) : {}
    this.squashInstanceAssignsWithEnvironments()
  }

  registerFilters (...filters) {
    for (const filter of filters) {
      for (const key in filter) {
        if (!Object.prototype.hasOwnProperty.call(filter, key)) continue
        const value = filter[key]
        if (value instanceof Function) {
          this.strainer[key] = value
        }
      }
    }
  }

  handleError (e) {
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

  invoke (methodName, ...args) {
    const method = this.strainer[methodName]
    if (method instanceof Function) {
      return method.apply(this.strainer, args)
    } else {
      const available = Object.keys(this.strainer)
      throw new Liquid.FilterNotFound('Unknown filter `' + methodName + '`, available: [' + (available.join(', ')) + ']')
    }
  }

  push (newScope = {}) {
    this.scopes.unshift(newScope)
    if (this.scopes.length > 100) {
      throw new Error('Nesting too deep')
    }
  }

  merge (newScope = {}) {
    const results = []
    for (const key in newScope) {
      if (!Object.prototype.hasOwnProperty.call(newScope, key)) continue
      const v = newScope[key]
      results.push(this.scopes[0][key] = v)
    }
    return results
  }

  pop () {
    if (this.scopes.length <= 1) {
      throw new Error('ContextError')
    }
    return this.scopes.shift()
  }

  lastScope () {
    return this.scopes[this.scopes.length - 1]
  }

  stack (newScope = {}, f) {
    let popLater = false
    try {
      if (arguments.length < 2) {
        f = newScope
        newScope = {}
      }

      this.push(newScope)

      const result = f()
      if (result && result.nodeify) {
        popLater = true
        result.nodeify(() => this.pop())
      }
      return result
    } finally {
      if (!popLater) {
        this.pop()
      }
    }
  }

  clearInstanceAssigns () {
    this.scopes[0] = {}
  }

  set (key, value) {
    this.scopes[0][key] = value
  }

  async get (key) {
    return this.resolve(key)
  }

  async hasKey (key) {
    const value = await this.resolve(key)
    return value != null
  }

  async resolve (key) {
    let match
    if (Liquid.Context.Literals.hasOwnProperty(key)) {
      return Liquid.Context.Literals[key]
    } else if (match = /^'(.*)'$/.exec(key)) { // eslint-disable-line
      return match[1]
    } else if (match = /^"(.*)"$/.exec(key)) { // eslint-disable-line
      return match[1]
    } else if (match = /^(\d+)$/.exec(key)) { // eslint-disable-line
      return Number(match[1])
    } else if (match = /^\((\S+)\.\.(\S+)\)$/.exec(key)) { // eslint-disable-line
      const loHi = [match[1], match[2]]
      const [loArg, hiArg] = await Promise.all(loHi.map(async arg => {
        const value = await this.resolve(arg)
        return Number(value)
      }))

      if (isNaN(loArg) || isNaN(hiArg)) {
        return []
      }

      return new Liquid.Range(loArg, hiArg + 1)
    } else if (match = /^(\d[\d.]+)$/.exec(key)) { // eslint-disable-line
      return Number(match[1])
    } else {
      return this.variable(key)
    }
  }

  async findVariable (key) {
    let variableScope = this.scopes.find((scope) => {
      return Object.prototype.hasOwnProperty.call(scope, key)
    })

    let variable
    if (variableScope == null) {
      this.environments.some(env => {
        variable = this.lookupAndEvaluate(env, key)
        if (variable != null) {
          variableScope = env
          return variableScope
        }
      })
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

    return this.liquify(variable)
  }

  async mapper (part, object) {
    if (object == null) {
      return object
    }

    object = await this.liquify(object)
    if (object == null) {
      return object
    }

    const bracketMatch = squareBracketed.exec(part)
    if (bracketMatch) {
      part = await this.resolve(bracketMatch[1])
    }

    const isArrayAccess = Array.isArray(object) && isFinite(part)
    const isObjectAccess = object instanceof Object && ((typeof object.hasKey === 'function' ? object.hasKey(part) : void 0) || part in object)
    const isSpecialAccess = !bracketMatch && object && (Array.isArray(object) || Object.prototype.toString.call(object) === '[object String]') && ['size', 'first', 'last'].indexOf(part) >= 0

    if (isArrayAccess || isObjectAccess) {
      const evaluated = await this.lookupAndEvaluate(object, part)
      return this.liquify(evaluated)
    } else if (isSpecialAccess) {
      switch (part) {
        case 'size':
          return this.liquify(object.length)
        case 'first':
          return this.liquify(object[0])
        case 'last':
          return this.liquify(object[object.length - 1])
        default:

          /* @covignore */
          throw new Error('Unknown special accessor: ' + part)
      }
    }
  }

  async variable (markup) {
    const parts = Liquid.Helpers.scan(markup, Liquid.VariableParser)
    let firstPart = parts.shift()

    const match = squareBracketed.exec(firstPart)
    if (match) {
      firstPart = match[1]
    }

    const object = await this.findVariable(firstPart)
    if (parts.length === 0) {
      return object
    }

    const iterator = async (object, index) => {
      if (index < parts.length) {
        const o = await this.mapper(parts[index], object)
        return iterator(o, index + 1)
      } else {
        return object
      }
    }

    try {
      return iterator(object, 0)
    } catch (err) {
      throw new Error("Couldn't walk variable: " + markup + ': ' + err)
    }
  }

  lookupAndEvaluate (obj, key) {
    if (obj instanceof Liquid.Drop) {
      return obj.get(key)
    } else {
      return obj != null ? obj[key] : void 0
    }
  }

  squashInstanceAssignsWithEnvironments () {
    const lastScope = this.lastScope()
    return Object.keys(lastScope).forEach(key => {
      return this.environments.some(env => {
        if (env.hasOwnProperty(key)) {
          lastScope[key] = this.lookupAndEvaluate(env, key)
          return true
        }
      })
    })
  }

  async liquify (object) {
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
      object.context = this
    }
    return object
  }
}

Context.Literals = {
  'null': null,
  'nil': null,
  '': null,
  'true': true,
  'false': false
}

module.exports = Context
