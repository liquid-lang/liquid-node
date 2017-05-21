// import Promise from 'any-promise'
import * as helpers from './helpers'
import {ContextError, Error, FilterNotFound, SyntaxError} from './errors'
import {VariableParser} from './regexps'
import Drop from './drop'

class Context {
  constructor (engine = null, environments = {}, outerScope = {}, registers = {}, rethrowErrors = false) {
    this.environments = helpers.flatten([environments])
    this.scopes = [outerScope]
    this.registers = registers
    this.errors = []
    this.rethrowErrors = rethrowErrors
    if (engine !== null) {
      this.strainer = engine.Strainer
    } else {
      this.strainer = new Map()
    }
    // this.strainer = new engine?.Strainer(this.) ? {}
    this.squashInstanceAssignsWithEnvironments()
  }

  /**
   * Adds filters to this context.
   *
   * Note that this does not register the filters with the main Template object.
   * See {@link Template#registerFilter} for that.
   */
  registerFilters (filters) {
    const self = this
    filters.entries().map(filter => filter.map(([k, v]) => {
      if (v instanceof Function) {
        self.strainer.set(k, v)
      }
    }))
  }
  handleError (e) {
    this.errors.push(e)
    if (this.rethrowErrors) {
      throw e
    }
    if (e instanceof SyntaxError) {
      return `Liquid syntax error: ${e.message}`
    }
    return `Liquid error: ${e.message}`
  }
  invoke (methodName, ...args) {
    if (this.strainer.has(methodName)) {
      const method = this.strainer.get(methodName)
      return method(...args)
    } // else
    throw new FilterNotFound(`Unknown Unknown filter \`${methodName}\`, available: [${this.strainer.keys().join(', ')}]`)
  }
  push (newScope = {}) {
    this.scopes.unshift(newScope)
    if (this.scopes.length > 100) {
      throw new Error('Nesting too deep')
    }
  }
  merge (newScope = {}) {
    Object.assign(this.scopes[0], newScope)
  }
  pop () {
    if (this.scopes.length <= 1) {
      throw new ContextError()
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
      const self = this
      this.push(newScope)
      const result = f()
      if (result != null && result.nodeify != null) {
        popLater = true
        result.nodeify(() => self.pop())
      }
      return result
    } catch (e) {}
    if (!popLater) {
      return this.pop()
    }
  }
  clearInstanceAssigns () {
    this.scopes[0] = {}
  }
  set (key, value) {
    this.scopes[0][key] = value
  }
  get (key) {
    return this.resolve(key)
  }
  hasKey (key) {
    return Promise.resolve(this.resolve(key)).then(v => v != null)
  }
  has (key) {
    return this.hasKey(key)
  }
  resolve (key) {
    if (Context.Literals.has(key)) {
      return Context.Literals.get(key)
    }
    let match = /^'(.*)'$/.exec(key)
    if (match) {
      return match[1]
    }
    match = /^"(.*)"$/.exec(key)
    if (match) {
      return match[1]
    }
    match = /^(\d+)$/.exec(key)
    if (match) {
      return Number(match[1])
    }
    match = /^\((\S+)\.\.(\S+)\)$/.exec(key) // Ranges
    if (match) {
      const lo = this.resolve(match[1])
      const hi = this.resolve(match[2])
      return Promise.all([lo, hi]).then(([lo, hi]) => {
        lo = Number(lo)
        hi = Number(hi)
        if (Number.isNaN(lo) || Number.isNaN(hi)) {
          return []
        }
        return Range(lo, hi + 1)
      })
    }
    match = /^(\d[\d.]+)$/.exec(key)
    if (match) {
      return Number(match[1])
    }
    return this.variable(key)
  }
  findVariable (key) {
    let variable
    let variableScope
    const self = this
    this.scopes.some((scope) => {
      if (scope.hasOwnProperty(key)) {
        variableScope = scope
        return true
      }
    })
    if (variableScope == null) {
      this.environments.some((env) => {
        variable = self.lookupAndEvaluate(env, key)
        if (variable != null) {
          variableScope = env
          return true
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
    if (variable != null) {
      variable = this.lookupAndEvaluate(variableScope, key)
    }
    return Promise.resolve(variable).then(v => self.liquify(v))
  }
  variable (markup) {
    const self = this
    return Promise.resolve().then(() => {
      const parts = helpers.scan(markup, VariableParser)
      const squareBracketed = /^\[(.*)\]$/

      let firstPart = parts.shift()
      const match = squareBracketed.exec(firstPart)
      if (match) {
        firstPart = match[1]
      }
      const object = self.findVariable(firstPart)
      if (parts.length === 0) {
        return object
      }
    })
  }
  lookupAndEvaluate (obj, key) {
    if (typeof obj.get === 'function') {
      return obj.get(key)
    }
    if (obj != null) {
      return obj[key]
    }
  }
  squashInstanceAssignsWithEnvironments () {
    const lastScope = this.lastScope()
    const self = this
    return Object.keys(lastScope).forEach((key) => {
      return self.environments.some((env) => {
        if (env.hasOwnProperty(key)) {
          lastScope[key] = self.lookupAndEvaluate(env, key)
          return true
        }
      })
    })
  }
  liquify (object) {
    const self = this
    return Promise.resolve(object).then((object) => {
      if (object == null) {
        return object
      }
      if (typeof object.toLiquid === 'function') {
        object = object.toLiquid()
      } else if (typeof object === 'object') {
        return true
      } else if (typeof object === 'function') {
        object = ''
      } else {
        Object.prototype.toString.call(object)
      }
      if (object instanceof Drop) {
        object.context = self
      }
      return object
    })
  }
}

Context.Literals = new Map([
  ['nil', null],
  ['null', null],
  ['', null],
  ['true', true],
  ['false', false]
])

export default Context
