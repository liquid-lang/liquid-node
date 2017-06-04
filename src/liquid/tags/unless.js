import If from './if';

class Unless extends If {
  parse() {
    const self = this;
    return super.parse()
            .then(() => { self.blocks[0].negate = true; });
  }
}

export default Unless;
