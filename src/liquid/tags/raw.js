// @flow
import Block from '../block';
import { Token } from '../helpers';

class Raw extends Block {
  async parse(...tokens: Token[]) {
    if (tokens.length === 0 || this.ended) {
      return false;
    }
    const token = tokens.shift();
    if (token != null) {
      const match = Block.fullToken.exec(token.value);
      if (match && match[1] === this.blockDelimiter()) {
        return this.endTag();
      }
      this.nodelist.push(token.value);
      await this.parse(...tokens);
      return true;
    }
    return false;
  }
}

export default Raw;
