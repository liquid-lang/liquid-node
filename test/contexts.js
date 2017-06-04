import range from 'lodash.range';
import { Liquid, expect, sinon } from './_helper';

let ctx = new Liquid.Context();

describe('Context', () => {
  beforeEach(() => {
    ctx = new Liquid.Context();
  });
  context('.handleError', () => {
    it('throws errors if enabled', () => {
      ctx.rethrowErrors = true;
      return expect((((ct => () => ct.handleError(new Liquid.Error('hello')))))(ctx)).to.throw(/hello/);
    });
    it('prints errors', () => expect(ctx.handleError(new Error('hello'))).to.match(/Liquid error/));
    return it('prints syntax errors', () => expect(ctx.handleError(new Liquid.SyntaxError('hello'))).to.match(/Liquid syntax error/));
  });
  context('.push', () => {
    it('pushes scopes', () => {
      const scope = {};
      ctx.push(scope);
      return expect(ctx.pop()).to.equal(scope);
    });
    it('pushes an empty scope by default', () => {
      ctx.push();
      return expect(ctx.pop()).to.deep.equal({});
    });
    return it('limits levels', () => {
      ctx = new Liquid.Context();
      return expect(() => range(0, 150).map(() => ctx.push()),
      ).to.throw(/Nesting too deep/);
    });
  });
  context('.pop', () => it('throws an exception if no scopes are left to pop', () => expect((((ctx => () => ctx.pop())))(ctx)).to.throw(/ContextError/)));
  context('.stack', () => it('automatically pops scopes', () => {
    const mySpy = sinon.spy();
    ctx.stack(null, mySpy);
    expect(mySpy).to.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    return expect(ctx.scopes.length).to.equal(1);
  }));
  context('.merge', () => {
    it('merges scopes', () => {
      ctx.push({
        x: 1,
        y: 2,
      });
      ctx.merge({
        y: 3,
        z: 4,
      });
      return expect(ctx.pop()).to.deep.equal({
        x: 1,
        y: 3,
        z: 4,
      });
    });
    return it('merges null-scopes', () => {
      ctx.push({
        x: 1,
      });
      ctx.merge();
      return expect(ctx.pop()).to.deep.equal({
        x: 1,
      });
    });
  });
  context('.resolve', () => {
    it('resolves strings', () => {
      expect(ctx.resolve("'42'")).to.equal('42');
      return expect(ctx.resolve('"42"')).to.equal('42');
    });
    it('resolves numbers', () => {
      expect(ctx.resolve('42')).to.equal(42);
      return expect(ctx.resolve('3.14')).to.equal(3.14);
    });
    return it('resolves illegal ranges', () => expect(ctx.resolve('(0..a)')).to.become([]));
  });
  context('.clearInstanceAssigns', () => it('clears current scope', () => {
    const scope = {
      x: 1,
    };
    ctx.push(scope);
    ctx.clearInstanceAssigns();
    return expect(ctx.pop()).to.deep.equal({});
  }));
  context('.hasKey', () => it('checks for variable', () => {
    ctx.push({
      a: 0,
    });
    ctx.push({
      b: 1,
    });
    ctx.push({
      c: true,
    });
    expect(ctx.hasKey('a')).to.become.ok;
    expect(ctx.hasKey('b')).to.become.ok;
    expect(ctx.hasKey('c')).to.become.ok;
    expect(ctx.hasKey('z')).not.to.become.ok;
  }));
  return context('.variable', () => it('supports special access', () => {
    ctx.push({
      a: [1, 99],
    });
    expect(ctx.variable('a.first')).to.become(1);
    expect(ctx.variable('a.size')).to.become(2);
    return expect(ctx.variable('a.last')).to.become(99);
  }));
});
