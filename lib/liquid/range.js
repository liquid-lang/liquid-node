var Range

module.exports = Range = (function () {
  function Range (start, end1, step1) {
    this.start = start
    this.end = end1
    this.step = step1 != null ? step1 : 0
    if (this.step === 0) {
      if (this.end < this.start) {
        this.step = -1
      } else {
        this.step = 1
      }
    }
    Object.seal(this)
  }

  Range.prototype.some = function (f) {
    var current, end, step
    current = this.start
    end = this.end
    step = this.step
    if (step > 0) {
      while (current < end) {
        if (f(current)) {
          return true
        }
        current += step
      }
    } else {
      while (current > end) {
        if (f(current)) {
          return true
        }
        current += step
      }
    }
    return false
  }

  Range.prototype.forEach = function (f) {
    return this.some(function (e) {
      f(e)
      return false
    })
  }

  Range.prototype.toArray = function () {
    var array
    array = []
    this.forEach(function (e) {
      return array.push(e)
    })
    return array
  }

  return Range
})()

Object.defineProperty(Range.prototype, 'length', {
  get: function () {
    return Math.floor((this.end - this.start) / this.step)
  }
})
