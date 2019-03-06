module.exports = (function () {
  function Drop () {}

  Drop.prototype.context = null

  Drop.prototype.hasKey = function (key) {
    return true
  }

  Drop.prototype.invokeDrop = function (methodOrKey) {
    var value
    if (this.constructor.isInvokable(methodOrKey)) {
      value = this[methodOrKey]
      if (typeof value === 'function') {
        return value.call(this)
      } else {
        return value
      }
    } else {
      return this.beforeMethod(methodOrKey)
    }
  }

  Drop.prototype.beforeMethod = function (method) {}

  Drop.isInvokable = function (method) {
    if (this.invokableMethods == null) {
      this.invokableMethods = (function (_this) {
        return function () {
          var blacklist, whitelist
          blacklist = Object.keys(Drop.prototype)
          whitelist = ['toLiquid']
          Object.keys(_this.prototype).forEach(function (k) {
            if (!(blacklist.indexOf(k) >= 0)) {
              return whitelist.push(k)
            }
          })
          return whitelist
        }
      })(this)()
    }
    return this.invokableMethods.indexOf(method) >= 0
  }

  Drop.prototype.get = function (methodOrKey) {
    return this.invokeDrop(methodOrKey)
  }

  Drop.prototype.toLiquid = function () {
    return this
  }

  Drop.prototype.toString = function () {
    return '[Liquid.Drop ' + this.constructor.name + ']'
  }

  return Drop
})()
