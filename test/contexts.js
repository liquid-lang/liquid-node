import {Liquid, expect, sinon} from './_helper'
import range from 'lodash.range'

let ctx = new Liquid.Context()

describe('Context', () => {
  beforeEach(function () {
    ctx = new Liquid.Context()
  })
  context('.handleError', () => {
    it('throws errors if enabled', function () {
      ctx.rethrowErrors = true
      return expect((((ctx => () => ctx.handleError(new Liquid.Error('hello')))))(ctx)).to.throw(/hello/)
    })
    it('prints errors', function () {
      return expect(ctx.handleError(new Error('hello'))).to.match(/Liquid error/)
    })
    return it('prints syntax errors', function () {
      return expect(ctx.handleError(new Liquid.SyntaxError('hello'))).to.match(/Liquid syntax error/)
    })
  })
  context('.push', () => {
    it('pushes scopes', function () {
      const scope = {}
      ctx.push(scope)
      return expect(ctx.pop()).to.equal(scope)
    })
    it('pushes an empty scope by default', function () {
      ctx.push()
      return expect(ctx.pop()).to.deep.equal({})
    })
    return it('limits levels', function () {
      ctx = new Liquid.Context()
      return expect(() => range(0, 150).map(() => ctx.push())
      ).to.throw(/Nesting too deep/)
    })
  })
  context('.pop', () => it('throws an exception if no scopes are left to pop', function () {
    return expect((((ctx => () => ctx.pop())))(ctx)).to.throw(/ContextError/)
  }))
  context('.stack', () => it('automatically pops scopes', function () {
    const mySpy = sinon.spy()
    ctx.stack(null, mySpy)
    expect(mySpy).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
    return expect(ctx.scopes.length).to.equal(1)
  }))
  context('.merge', () => {
    it('merges scopes', function () {
      ctx.push({
        x: 1,
        y: 2
      })
      ctx.merge({
        y: 3,
        z: 4
      })
      return expect(ctx.pop()).to.deep.equal({
        x: 1,
        y: 3,
        z: 4
      })
    })
    return it('merges null-scopes', function () {
      ctx.push({
        x: 1
      })
      ctx.merge()
      return expect(ctx.pop()).to.deep.equal({
        x: 1
      })
    })
  })
  context('.resolve', () => {
    it('resolves strings', function () {
      expect(ctx.resolve("'42'")).to.equal('42')
      return expect(ctx.resolve('"42"')).to.equal('42')
    })
    it('resolves numbers', function () {
      expect(ctx.resolve('42')).to.equal(42)
      return expect(ctx.resolve('3.14')).to.equal(3.14)
    })
    return it('resolves illegal ranges', function () {
      return expect(ctx.resolve('(0..a)')).to.become([])
    })
  })
  context('.clearInstanceAssigns', () => it('clears current scope', function () {
    const scope = {
      x: 1
    }
    ctx.push(scope)
    ctx.clearInstanceAssigns()
    return expect(ctx.pop()).to.deep.equal({})
  }))
  context('.hasKey', () => it('checks for variable', function () {
    ctx.push({
      a: 0
    })
    ctx.push({
      b: 1
    })
    ctx.push({
      c: true
    })
    console.log(ctx.hasKey)
    /* eslint-disable no-unused-expressions */
    expect(ctx.hasKey('a')).to.become.ok
    expect(ctx.hasKey('b')).to.become.ok
    expect(ctx.hasKey('c')).to.become.ok
    expect(ctx.hasKey('z')).not.to.become.ok
    /* eslint-enable no-unused-expressions */
  }))
  return context('.variable', () => it('supports special access', function () {
    ctx.push({
      a: [1, 99]
    })
    expect(ctx.variable('a.first')).to.become(1)
    expect(ctx.variable('a.size')).to.become(2)
    return expect(ctx.variable('a.last')).to.become(99)
  }))
})
