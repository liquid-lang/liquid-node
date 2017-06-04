import { Liquid, expect, renderTest } from './_helper';

class Droplet extends Liquid.Drop {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  b() { this.m_b = 2; return 2; }
}
describe('Drop', () => {
  const self = this || {};
  beforeEach(() => {
    self.drop = new Droplet();
  });
  it('is an instanceof Drop', () => {
    expect(self.drop).to.be.instanceof(self.Droplet);
    return expect(self.drop).to.be.instanceof(Liquid.Drop);
  });
  it('protects regular objects', () => {
    const notDrop = {
      a: 1,
      b() {
        return 'foo';
      },
    };
    return renderTest('1', '{{ drop.a }}{{ drop.b }}', {
      drop: notDrop,
    });
  });
  it('can be rendered', () => renderTest('12', '{{ drop.a }}{{ drop.b }}', {
    drop: self.drop,
  }));
  it('checks if methods are invokable', () => {
    expect(self.Droplet.isInvokable('a')).to.be.ok();
    expect(self.Droplet.isInvokable('b')).to.be.ok();
    expect(self.Droplet.isInvokable('toLiquid')).to.be.ok();
    expect(self.Droplet.isInvokable('c')).to.be.not.ok();
    expect(self.Droplet.isInvokable('invokeDrop')).to.be.not.ok();
    expect(self.Droplet.isInvokable('beforeMethod')).to.be.not.ok();
    return expect(self.Droplet.isInvokable('hasKey')).to.be.not.ok();
  });
  it('renders', () => renderTest('[Liquid.Drop Droplet]', '{{ drop }}', {
    drop: self.drop,
  }));
  return it('allows method-hooks', () => {
    self.drop.beforeMethod = (m) => {
      if (m === 'c') {
        return 1;
      }
      return 2;
    };
    return renderTest('12', '{{ drop.c }}{{ drop.d }}', {
      drop: self.drop,
    });
  });
});

