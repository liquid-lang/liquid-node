const Liquid = require('..')

describe('Engine', function () {
  beforeEach(function () {
    this.filters = Liquid.StandardFilters
  })

  it('should create strainers', function () {
    const engine = new Liquid.Engine()
    const strainer = new engine.Strainer()
    return expect(strainer.size).to.exist
  })

  return it('should create separate strainers', function () {
    const engine1 = new Liquid.Engine()
    engine1.registerFilters({ foo1 () { return 'foo1' } })
    const strainer1 = new engine1.Strainer()
    expect(typeof strainer1.size).to.equal('function')
    expect(typeof strainer1.foo1).to.equal('function')

    const engine2 = new Liquid.Engine()
    engine2.registerFilters({ foo2 () { return 'foo2' } })
    const strainer2 = new engine2.Strainer()
    expect(typeof strainer2.size).to.equal('function')
    expect(typeof strainer2.foo2).to.equal('function')

    expect(strainer1.foo2).to.equal(undefined)
    return expect(strainer2.foo1).to.equal(undefined)
  })
})
