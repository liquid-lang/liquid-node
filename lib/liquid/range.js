module.exports = class Range {
  constructor (start, end, step) {
    this.start = start
    this.end = end
    this.step = step != null ? step : 0
    if (this.step === 0) {
      if (this.end < this.start) {
        this.step = -1
      } else {
        this.step = 1
      }
    }
    Object.seal(this)
  }

  get length () {
    return Math.floor((this.end - this.start) / this.step)
  }

  some (f) {
    let current = this.start
    const end = this.end
    const step = this.step
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

  forEach (f) {
    return this.some(function (e) {
      f(e)
      return false
    })
  }

  toArray () {
    const array = []
    this.forEach((e) => {
      return array.push(e)
    })
    return array
  }
}
