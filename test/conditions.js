const Liquid = require('..')

describe('Liquid.Condition', function () {
  it('evaluates without a context', function () {
    const c = new Liquid.Condition('1', '==', '1')

    return expect(c.evaluate()).to.be.fulfilled.then(v => expect(v).to.equal(true))
  })

  it('fails on illegal operators', () => renderTest('Liquid error: Unknown operator baz', '{% if foo baz bar %}X{% endif %}', {}, false))

  context('if', function () {
    it('renders on `true` variables', () => renderTest('X1', '{% if var %}X1{% endif %}', { var: true }))

    it("doesn't render on `false` variables", () => renderTest('', '{% if var %}X2{% endif %}', { var: false }))

    it('renders on truthy variables', () => renderTest('X3', '{% if var %}X3{% endif %}', { var: 'abc' }))

    it("doesn't render on falsy variables", () => renderTest('', '{% if var %}X4{% endif %}', { var: null }))

    it('renders on truthy object properties', () => renderTest('X5', '{% if foo.bar %}X5{% endif %}', { foo: { bar: 'abc' } }))

    it("doesn't render on falsy object properties", () => renderTest('', '{% if foo.bar %}X6{% endif %}', { foo: { bar: null } }))

    it("doesn't render on non existing properties", () => renderTest('', '{% if foo.bar %}X7{% endif %}', { foo: {} }))

    it('renders on truthy constants', () => renderTest('X8', '{% if "foo" %}X8{% endif %}'))

    it("doesn't render on falsy constants", () => renderTest('', '{% if null %}X9{% endif %}', { null: 42 }))

    context('with condition', function () {
      it('(true or true) renders', () => renderTest('X10', '{% if a or b %}X10{% endif %}', { a: true, b: true }))

      it('(true or false) renders', () => renderTest('X11', '{% if a or b %}X11{% endif %}', { a: true, b: false }))

      it('(false or true) renders', () => renderTest('X12', '{% if a or b %}X12{% endif %}', { a: false, b: true }))

      return it("(true or true) doesn't render", () => renderTest('', '{% if a or b %}X13{% endif %}', { a: false, b: false }))
    })

    context('with operators', function () {
      // This has been made async as there were race conditions
      it('that evaluate to true renders', async () => {
        await renderTest('A1', '{% if a == 42 %}A1{% endif %}', { a: 42 })
        await renderTest('A2', '{% if a is 42 %}A2{% endif %}', { a: 42 })
        await renderTest('A3', '{% if a != 42 %}A3{% endif %}', { a: 41 })
        await renderTest('A4', '{% if a isnt 42 %}A4{% endif %}', { a: 41 })
        await renderTest('A5', '{% if a <> 42 %}A5{% endif %}', { a: 41 })

        await renderTest('A6', '{% if a > 42 %}A6{% endif %}', { a: 43 })
        await renderTest('A7', '{% if a >= 42 %}A7{% endif %}', { a: 43 })
        await renderTest('A8', '{% if a >= 42 %}A8{% endif %}', { a: 42 })

        await renderTest('A9', '{% if a < 42 %}A9{% endif %}', { a: 41 })
        await renderTest('X1', '{% if a <= 42 %}X1{% endif %}', { a: 41 })
        await renderTest('X2', '{% if a <= 42 %}X2{% endif %}', { a: 42 })

        await renderTest('X3', '{% if a contains 2 %}X3{% endif %}', { a: [1, 2, 3] })
        await renderTest('X4', '{% if a contains "b" %}X4{% endif %}', { a: 'abc' })

        await renderTest('X5', '{% if a == empty %}X5{% endif %}')
        await renderTest('X6', '{% if empty == a %}X6{% endif %}')
        await renderTest('X7', '{% if a == empty %}X7{% endif %}', { a: [] })

        await renderTest('X8', '{% if a == blank %}X8{% endif %}')
        await renderTest('X9', '{% if blank == a %}X9{% endif %}')
        await renderTest('X0', '{% if a != blank %}X0{% endif %}', { a: 'a' })
      })

      return it("that evaluate to false doesn't render", () =>
        Promise.all([
          renderTest('', '{% if a != 42 %}X{% endif %}', { a: 42 }),

          renderTest('', '{% if a contains 2 %}X{% endif %}'),
          renderTest('', '{% if a contains 2 %}X{% endif %}', { a: { indexOf: null } })
        ])
      )
    })

    context('with awful markup', () =>
      it('renders correctly', function () {
        const awfulMarkup = "a == 'and' and b == 'or' and c == 'foo and bar' and d == 'bar or baz' and e == 'foo' and foo and bar"
        const assigns = { 'a': 'and', 'b': 'or', 'c': 'foo and bar', 'd': 'bar or baz', 'e': 'foo', 'foo': true, 'bar': true }
        return renderTest(' YES ', `{% if ${awfulMarkup} %} YES {% endif %}`, assigns)
      })
    )

    return context('with else-branch', function () {
      it('renders else-branch on falsy variables', () => renderTest('ELSE', '{% if var %}IF{% else %}ELSE{% endif %}', { var: false }))

      return it('renders if-branch on truthy variables', () => renderTest('IF', '{% if var %}IF{% else %}ELSE{% endif %}', { var: true }))
    })
  })

  describe('unless', function () {
    it("negates 'false'", () => renderTest(' TRUE ', '{% unless false %} TRUE {% endunless %}'))

    it("negates 'true'", () => renderTest('', '{% unless true %} FALSE {% endunless %}'))

    return it('supports else', () => renderTest(' TRUE ', '{% unless true %} FALSE {% else %} TRUE {% endunless %}'))
  })

  return describe('case', function () {
    it('outputs truthy when branches', () => renderTest(' 1 ', '{% case var %}{% when 1 %} 1 {% endcase %}', { var: 1 }))

    it("doesn't output falsy when branches", () => renderTest('', '{% case var %}{% when 1 %} 1 {% endcase %}', { var: 2 }))

    it('only prints one branch (duplicate when)', () => renderTest(' 1 ', '{% case var %}{% when 1 %} 1 {% when 1 %} 1 {% endcase %}', { var: 1 }))

    it('does support `or`', () => renderTest(' 1/2 ', '{% case var %}{% when 1 or 2 %} 1/2 {% endcase %}', { var: 2 }))

    return it('does support `else`', () => renderTest(' ELSE ', '{% case var %}{% when 1 %} 1 {% else %} ELSE {% endcase %}', { var: 2 }))
  })
})
