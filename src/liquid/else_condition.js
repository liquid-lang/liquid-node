// @flow
import Condition from './condition';
import Context from './context';

class ElseCondition extends Condition {
  constructor() {
    super(true, '==', true);
  }
}

export default ElseCondition;
