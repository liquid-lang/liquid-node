const Liquid = require('../liquid')

module.exports = class ElseCondition extends Liquid.Condition {
  evaluate () {
    return true
  }
}
