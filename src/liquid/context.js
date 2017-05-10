import Promise from 'any-promise'
import helpers from './helpers'
import {FilterNotFound} from './errors'

class Context {
  constructor (engine = null, environments = {}, outerScope = {}, registers = {}, rethrowErrors = false) {
    this.environments = helpers.flatten([environments])
    this.scopes = [outerScope]
    this.registers = registers
    this.errors = []
    this.rethrowErrors = rethrowErrors
    if (engine !== null) {
      this.strainer = new engine.Strainer(this)
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
  registerFilters (...filters) {
    const self = this
    filters.map(filter => filter.map(([k, v]) => {
      if (v instanceof Function) {
        self.strainer.set(k, v)
      }
    }
  ))
  }

  handleErrors (e) {
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
  pop () {
    if (this.scopes.length <= 1) {
      throw new Error('ContextError')
    }
    return this.scopes.shift()
  }
  merge (newScope = {}) {
    Object.assign(this.scopes[0], newScope)
  }
  lastScope () {
    return this.scopes[this.scopes.length - 1]
  }
}

export default Context
