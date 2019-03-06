const Liquid = require('..')
const util = require('util')

describe('Liquid.Variable', function () {
  it('is parsed', function () {
    const variable = new Liquid.Variable('hello')
    return expect(variable.name).to.equal('hello')
  })

  it('parses filters', function () {
    const v = new Liquid.Variable('hello | textileze')
    expect('hello').to.equal(v.name)
    return expect([['textileze', []]]).to.deep.equal(v.filters)
  })

  it('parses multiple filters', function () {
    const v = new Liquid.Variable('hello | textileze | paragraph')
    expect('hello').to.equal(v.name)
    return expect([['textileze', []], ['paragraph', []]]).to.deep.equal(v.filters)
  })

  it('parses filters with arguments', function () {
    const v = new Liquid.Variable("hello | strftime: '%Y'")
    expect('hello').to.equal(v.name)
    return expect([['strftime', ["'%Y'"]]]).to.deep.equal(v.filters)
  })

  it('parses filters with a string-argument that contains an argument-separator', function () {
    const v = new Liquid.Variable("hello | strftime: '%Y, okay?'")
    expect('hello').to.equal(v.name)
    return expect([['strftime', ["'%Y, okay?'"]]]).to.deep.equal(v.filters)
  })

  it('parses filters with date formatting parameter', function () {
    const v = new Liquid.Variable(" '2006-06-06' | date: \"%m/%d/%Y\" ")
    expect("'2006-06-06'").to.equal(v.name)
    return expect([['date', ['"%m/%d/%Y"']]]).to.deep.equal(v.filters)
  })

  describe('with multiple arguments', function () {
    it('parses ', function () {
      const v = new Liquid.Variable("'typo' | link_to: 'Typo', true")
      expect("'typo'").to.equal(v.name)
      return expect([['link_to', ["'Typo'", 'true']]]).to.deep.equal(v.filters)
    })

    it('parses', function () {
      const v = new Liquid.Variable("'typo' | link_to: 'Typo', false")
      expect("'typo'").to.equal(v.name)
      return expect([['link_to', ["'Typo'", 'false']]]).to.deep.equal(v.filters)
    })

    it('parses', function () {
      const v = new Liquid.Variable("'foo' | repeat: 3")
      expect("'foo'").to.equal(v.name)
      return expect([['repeat', ['3']]]).to.deep.equal(v.filters)
    })

    it('parses', function () {
      const v = new Liquid.Variable("'foo' | repeat: 3, 3")
      expect("'foo'").to.equal(v.name)
      return expect([['repeat', ['3', '3']]]).to.deep.equal(v.filters)
    })

    it('parses', function () {
      const v = new Liquid.Variable("'foo' | repeat: 3, 3, 3")
      expect("'foo'").to.equal(v.name)
      return expect([['repeat', ['3', '3', '3']]]).to.deep.equal(v.filters)
    })

    return it('parses when a string-argument contains an argument-separator', function () {
      const v = new Liquid.Variable(" hello | things: \"%Y, okay?\", 'the other one'")
      expect('hello').to.equal(v.name)
      return expect([['things', ['"%Y, okay?"', "'the other one'"]]]).to.deep.equal(v.filters)
    })
  })

  it('renders', () => renderTest('worked', '{{ test }}', { test: 'worked' }))

  it('renders when empty', () => renderTest('', '{{ }}'))

  it('allows ranges', () => renderTest('1-2-3', '{{ (1..3) | join:"-" }}'))

  context('with filter', function () {
    it('renders', function () {
      const MoneyFilter = {
        money (input) { return util.format(' $%d ', input) },
        money_with_underscore (input) { return util.format(' $%d ', input) }
      }

      const context = new Liquid.Context()
      context.set('var', 1000)
      context.registerFilters(MoneyFilter)

      const variable = new Liquid.Variable('var | money')
      return variable.render(context).then(result => expect(result).to.equal(' $1000 '))
    })

    it('renders empty string', () => renderTest('', '{{ test | append: "" }}', {}))

    return it('renders on unknown filter', () => renderTest(/filter 'doesNotExist' in ' 1 \| doesNotExist ' could not be found/, '{{ 1 | doesNotExist }}', {}, false))
  })

  // TODO: This doesn't work yet.
  return it.skip("prevents 'RangeError: Maximum call stack size exceeded'", function () {
    let doc = '{{ a'
    while (doc.length < (1024 * 1024)) { doc += '.a' }
    doc += '.b'
    doc += ' }}'

    const a = {}
    a.a = () => a
    a.b = () => 'STOP'

    return renderTest('STOP', doc, { a })
  })
})
