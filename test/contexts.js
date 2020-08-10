const Liquid = require('..')
const sinon = require('sinon')

describe('Context', function () {
  beforeEach(function () { this.ctx = new Liquid.Context() })

  context('.handleError', function () {
    it('throws errors if enabled', function () {
      this.ctx.rethrowErrors = true

      return expect(() => {
        return this.ctx.handleError(new Error('hello'))
      }).to.throw(/hello/)
    })

    it('prints errors', function () {
      return expect(this.ctx.handleError(new Error('hello'))).to.match(/Liquid error/)
    })

    return it('prints syntax errors', function () {
      return expect(this.ctx.handleError(new Liquid.SyntaxError('hello'))).to.match(/Liquid syntax error/)
    })
  })

  context('.push', function () {
    it('pushes scopes', function () {
      const scope = {}
      this.ctx.push(scope)
      return expect(this.ctx.pop()).to.equal(scope)
    })

    it('pushes an empty scope by default', function () {
      this.ctx.push()
      return expect(this.ctx.pop()).to.deep.equal({})
    })

    return it('limits levels', function () {
      return expect(() => {
        return __range__(0, 150, true).map((i) => this.ctx.push())
      })
        .to.throw(/Nesting too deep/)
    })
  })

  context('.pop', () =>
    it('throws an exception if no scopes are left to pop', function () {
      return expect(() => {
        return this.ctx.pop()
      }).to.throw(/ContextError/)
    })
  )

  context('.stack', () =>
    it('automatically pops scopes', function () {
      const mySpy = sinon.spy()
      this.ctx.stack(null, mySpy)

      expect(mySpy.calledOnce).to.equal(true)
      expect(this.ctx.scopes.length).to.equal(1)
    })
  )

  context('.merge', function () {
    it('merges scopes', function () {
      this.ctx.push({ x: 1, y: 2 })
      this.ctx.merge({ y: 3, z: 4 })
      return expect(this.ctx.pop()).to.deep.equal({ x: 1, y: 3, z: 4 })
    })

    return it('merges null-scopes', function () {
      this.ctx.push({ x: 1 })
      this.ctx.merge()
      return expect(this.ctx.pop()).to.deep.equal({ x: 1 })
    })
  })

  context('.resolve', function () {
    it('resolves strings', async function () {
      expect(await this.ctx.resolve('"42"')).to.equal('42')
    })

    it('resolves numbers', async function () {
      expect(await this.ctx.resolve('42')).to.equal(42)
      expect(await this.ctx.resolve('3.14')).to.equal(3.14)
    })

    return it('resolves illegal ranges', function () {
      return expect(this.ctx.resolve('(0..a)')).to.become([])
    })
  })

  context('.clearInstanceAssigns', () =>
    it('clears current scope', function () {
      const scope = { x: 1 }
      this.ctx.push(scope)
      this.ctx.clearInstanceAssigns()
      return expect(this.ctx.pop()).to.deep.equal({})
    })
  )

  context('.hasKey', () =>
    it('checks for variable', async function () {
      this.ctx.push({ a: 0 })
      this.ctx.push({ b: 1 })
      this.ctx.push({ c: true })

      expect(await this.ctx.hasKey('a')).to.equal(true)
      expect(await this.ctx.hasKey('b')).to.equal(true)
      expect(await this.ctx.hasKey('c')).to.equal(true)

      expect(await this.ctx.hasKey('z')).to.equal(false)
    })
  )

  return context('.variable', () =>
    it('supports special access', function () {
      this.ctx.push({ a: [1, 99] })
      expect(this.ctx.variable('a.first')).to.become(1)
      expect(this.ctx.variable('a.size')).to.become(2)
      return expect(this.ctx.variable('a.last')).to.become(99)
    })
  )
})

function __range__ (left, right, inclusive) {
  let range = []
  let ascending = left < right
  let end = !inclusive ? right : ascending ? right + 1 : right - 1
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i)
  }
  return range
}
