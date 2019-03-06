const Liquid = require('..')

describe('Liquid.Condition', function () {
  it('evaluates without a context', function () {
    const c = new Liquid.Condition('1', '==', '1')

    return expect(c.evaluate()).to.be.fulfilled.then(v => expect(v).to.equal(true))
  })

  it('fails on illegal operators', () => renderTest('Liquid error: Unknown operator baz', '{% if foo baz bar %}X{% endif %}', {}, false))

  context('if', function () {
    it('renders on `true` variables', () => renderTest('X', '{% if var %}X{% endif %}', { var: true }))

    it("doesn't render on `false` variables", () => renderTest('', '{% if var %}X{% endif %}', { var: false }))

    it('renders on truthy variables', () => renderTest('X', '{% if var %}X{% endif %}', { var: 'abc' }))

    it("doesn't render on falsy variables", () => renderTest('', '{% if var %}X{% endif %}', { var: null }))

    it('renders on truthy object properties', () => renderTest('X', '{% if foo.bar %}X{% endif %}', { foo: { bar: 'abc' } }))

    it("doesn't render on falsy object properties", () => renderTest('', '{% if foo.bar %}X{% endif %}', { foo: { bar: null } }))

    it("doesn't render on non existing properties", () => renderTest('', '{% if foo.bar %}X{% endif %}', { foo: {} }))

    it('renders on truthy constants', () => renderTest('X', '{% if "foo" %}X{% endif %}'))

    it("doesn't render on falsy constants", () => renderTest('', '{% if null %}X{% endif %}', { null: 42 }))

    context('with condition', function () {
      it('(true or true) renders', () => renderTest('X', '{% if a or b %}X{% endif %}', { a: true, b: true }))

      it('(true or false) renders', () => renderTest('X', '{% if a or b %}X{% endif %}', { a: true, b: false }))

      it('(false or true) renders', () => renderTest('X', '{% if a or b %}X{% endif %}', { a: false, b: true }))

      return it("(true or true) doesn't render", () => renderTest('', '{% if a or b %}X{% endif %}', { a: false, b: false }))
    })

    context('with operators', function () {
      it('that evaluate to true renders', () =>
        Promise.all([
          renderTest('X', '{% if a == 42 %}X{% endif %}', { a: 42 }),
          renderTest('X', '{% if a is 42 %}X{% endif %}', { a: 42 }),

          renderTest('X', '{% if a != 42 %}X{% endif %}', { a: 41 }),
          renderTest('X', '{% if a isnt 42 %}X{% endif %}', { a: 41 }),
          renderTest('X', '{% if a <> 42 %}X{% endif %}', { a: 41 }),

          renderTest('X', '{% if a > 42 %}X{% endif %}', { a: 43 }),
          renderTest('X', '{% if a >= 42 %}X{% endif %}', { a: 43 }),
          renderTest('X', '{% if a >= 42 %}X{% endif %}', { a: 42 }),

          renderTest('X', '{% if a < 42 %}X{% endif %}', { a: 41 }),
          renderTest('X', '{% if a <= 42 %}X{% endif %}', { a: 41 }),
          renderTest('X', '{% if a <= 42 %}X{% endif %}', { a: 42 }),

          renderTest('X', '{% if a contains 2 %}X{% endif %}', { a: [1, 2, 3] }),
          renderTest('X', '{% if a contains "b" %}X{% endif %}', { a: 'abc' }),

          renderTest('X', '{% if a == empty %}X{% endif %}'),
          renderTest('X', '{% if empty == a %}X{% endif %}'),
          renderTest('X', '{% if a == empty %}X{% endif %}', { a: [] }),

          renderTest('X', '{% if a == blank %}X{% endif %}'),
          renderTest('X', '{% if blank == a %}X{% endif %}'),
          renderTest('X', '{% if a != blank %}X{% endif %}', { a: 'a' })
        ])
      )

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
