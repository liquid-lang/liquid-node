module.exports = class Drop {
  constructor () {
    this.context = null
  }

  static isInvokable (method) {
    if (!this.invokableMethods) {
      const denylist = Object.keys(Drop.prototype)
      const allowlist = ['toLiquid']

      Object.keys(this.prototype).forEach((k) => {
        if (!(denylist.indexOf(k) >= 0)) {
          return allowlist.push(k)
        }
      })

      this.invokableMethods = allowlist
    }

    return this.invokableMethods.indexOf(method) >= 0
  }

  hasKey () {
    return true
  }

  invokeDrop (methodOrKey) {
    if (this.constructor.isInvokable(methodOrKey)) {
      const value = this[methodOrKey]
      if (typeof value === 'function') {
        return value.call(this)
      } else {
        return value
      }
    } else {
      return this.beforeMethod(methodOrKey)
    }
  }

  beforeMethod () {}

  get (methodOrKey) {
    return this.invokeDrop(methodOrKey)
  }

  toLiquid () {
    return this
  }

  toString () {
    return '[Liquid.Drop ' + this.constructor.name + ']'
  }
}
