const { expect } = require('chai')
const Liquid = require('..')

describe('Blocks (in general)', function () {
  beforeEach(function () { this.engine = new Liquid.Engine() })

  it("don't accept 'else'", function () {
    return expect(this.engine.parse('{% capture %}{% else %}{% endcapture %}')).to.be.rejectedWith(Liquid.SyntaxError,
      /tag does not expect else tag/)
  })

  it("don't accept plain 'end'", function () {
    return expect(this.engine.parse('{% capture %}{% end %}')).to.be.rejectedWith(Liquid.SyntaxError,
      /'end' is not a valid delimiter/)
  })

  it('fail if not terminated', function () {
    return expect(this.engine.parse('{% capture %}')).to.be.rejectedWith(Liquid.SyntaxError,
      /tag was never closed/)
  })

  it('fail on odd tags', function () {
    return expect(this.engine.parse('{% %}')).to.be.rejectedWith(Liquid.SyntaxError,
      /was not properly terminated/)
  })

  return it('fail on illegal variables', function () {
    return expect(this.engine.parse('{{ 2394 ')).to.be.rejectedWith(Liquid.SyntaxError,
      /Variable .* was not properly terminated/)
  })
})

describe('Assign', function () {
  it('assigns a variable', () =>
    renderTest('.foo.', '{% assign foo = values %}.{{ foo[0] }}.',
      { values: ['foo', 'bar', 'baz'] })
  )

  it('assigns a variable', () =>
    renderTest('.bar.', '{% assign foo = values %}.{{ foo[1] }}.',
      { values: ['foo', 'bar', 'baz'] })
  )

  return it('applies filters', () =>
    renderTest('.BAR.', '{% assign foo = bar | upcase %}.{{ foo }}.',
      { bar: 'bar' })
  )
})

describe('For', function () {
  it('loops', () => renderTest(' 1  2  3 ', '{%for item in array%} {{item}} {%endfor%}', { array: [1, 2, 3] }))

  it('loops', () => renderTest('123', '{%for item in array%}{{item}}{%endfor%}', { array: [1, 2, 3] }))

  it('loops', () => renderTest('abcd', '{%for item in array%}{{item}}{%endfor%}', { array: ['a', 'b', 'c', 'd'] }))

  it('loops', () => renderTest('a b c', '{%for item in array%}{{item}}{%endfor%}', { array: ['a', ' ', 'b', ' ', 'c'] }))

  it('loops', () => renderTest('abc', '{%for item in array%}{{item}}{%endfor%}', { array: ['a', '', 'b', '', 'c'] }))

  it('loops over ranges', () => renderTest('1234', '{%for item in (1..4)%}{{item}}{%endfor%}'))

  it('loops over hashes/objects', () => renderTest('A1B2', '{%for item in hash %}{{item[0] | upcase}}{{item[1]}}{%endfor%}', { hash: { a: 1, b: 2 } }))

  describe('else', function () {
    it('renders for undefined collections ', () => renderTest('none yet', '{% for i in c %}X{% else %}none yet{% endfor %}'))

    it('renders for empty collections', () => renderTest('none yet', '{% for i in c %}X{% else %}none yet{% endfor %}', { c: [] }))

    return it('renders for empty hashes', () => renderTest('none yet', '{% for i in c %}X{% else %}none yet{% endfor %}', { c: {} }))
  })

  describe('with reverse', () =>
    it('does not modify the source array', function () {
      const array = [ 1, 2, 3 ]
      return renderTest('321', '{% for item in array reversed %}{{ item }}{% endfor %}', { array }).then(function () {
        // assert array unmodified
        expect(array.length).to.eql(3)
        return expect(array[0]).to.eql(1)
      })
    })
  )

  return describe('with index', function () {
    it('renders correctly', () => renderTest('123', '{%for item in array%}{{forloop.index}}{%endfor%}', { array: [1, 2, 3] }))
    it('renders correctly', () => renderTest('321', '{%for item in array%}{{forloop.rindex}}{%endfor%}', { array: [1, 2, 3] }))
    it('renders correctly', () => renderTest('210', '{%for item in array%}{{forloop.rindex0}}{%endfor%}', { array: [1, 2, 3] }))
    it('renders correctly', () => renderTest('123', '{%for item in array%}{{forloop.index}}{%endfor%}', { array: ['a', 'b', 'c'] }))
    it('renders correctly', () => renderTest('123', '{%for item in array%}{{forloop.index}}{%endfor%}', { array: ['a', 'b', 'c'] }))
    it('renders correctly', () => renderTest('012', '{%for item in array%}{{forloop.index0}}{%endfor%}', { array: ['a', 'b', 'c'] }))
    it('renders correctly', () => renderTest('1234', '{%for item in array%}{{forloop.index}}{%endfor%}', { array: [{ a: 1 }, { b: 1 }, { c: 1 }, { d: 1 }] }))
    it('renders correctly', () => renderTest('', '{%for item in array%}{{forloop.index}}{%endfor%}', { array: [] }))
    it('renders correctly', () => renderTest('first123', '{% for item in array %}{% if forloop.first%}first{% endif %}{{forloop.index}}{% endfor %}', { array: [1, 2, 3] }))
    it('renders correctly', () => renderTest('123last', '{% for item in array %}{{forloop.index}}{% if forloop.last%}last{% endif %}{% endfor %}', { array: [1, 2, 3] }))
    it('renders correctly', () => renderTest('vw', '{%for item in array limit:2%}{{item}}{%endfor%}', { array: ['v', 'w', 'x', 'y'] }))
    return it('renders correctly', () => renderTest('xy', '{%for item in array offset:2%}{{item}}{%endfor%}', { array: ['v', 'w', 'x', 'y'] }))
  })
})

describe('IfChanged', function () {
  it('renders correctly', () => renderTest('123', '{%for item in array%}{%ifchanged%}{{item}}{% endifchanged %}{%endfor%}', { array: [ 1, 1, 2, 2, 3, 3 ] }))
  return it('renders correctly', () => renderTest('1', '{%for item in array%}{%ifchanged%}{{item}}{% endifchanged %}{%endfor%}', { array: [ 1, 1, 1, 1 ] }))
})

describe('Capture', function () {
  it('captures variables', () => renderTest('X', '{% capture foo %}Foo{% endcapture %}{% if "Foo" == foo %}X{% endif %}'))
  return it('captures and renders', () => renderTest('Foo', '{% capture foo %}Foo{% endcapture %}{{ foo }}'))
})

describe('Raw', function () {
  it('prints liquid-tags in body', () =>
    renderTest('{% if value %}{{ value }}{% endif %}',
      '{% raw %}{% if value %}{{ value }}{% endif %}{% endraw %}',
      { value: true })
  )

  it('ignores liquid-tags in body', () => renderTest('{% woot %}', '{% raw %}{% woot %}{% endraw %}'))

  return it('ends on first endraw', () => renderTest('{% raw %}X', '{% raw %}{% raw %}X{% endraw %}'))
})

describe('Comment', () =>
  it("it swallows it's body", () =>
    renderTest('',
      '{% comment %}This is a comment{% endcomment %}')
  )
)

describe('Increment', function () {
  it('increments like i++', () => renderTest('1', '{% increment i %}', { i: 1 }))

  return it('interprents non-existing variables as 0', () => renderTest('0', '{% increment i %}'))
})

describe('Decrements', function () {
  it('decrements like --i', () => renderTest('0', '{% decrement i %}', { i: 1 }))

  return it('interprents non-existing variables as 0', () => renderTest('-1', '{% decrement i %}'))
})

describe('Render', () => {
  let engine

  beforeEach(() => {
    engine = new Liquid.Engine()
    engine.registerFileSystem(new Liquid.LocalFileSystem('./test/fixtures'))
  })

  it('renders the provided snippet', async () => {
    const actual = await engine.parseAndRender('{% render "render" %}')
    expect(actual).to.equal('Rendered!')
  })

  it('renders a snippet whose path is a variable', async () => {
    const actual = await engine.parseAndRender('{% assign filepath = "render" %}{% render filepath %}')
    expect(actual).to.equal('Rendered!')
  })

  it('renders the provided snippet with a single variable', async () => {
    const actual = await engine.parseAndRender('{% render "include", name: "Jason" %}')
    expect(actual).to.equal('Jason')
  })

  it('renders the provided snippet with a single pre-assigned variable', async () => {
    const actual = await engine.parseAndRender('{% assign name = "Jason" %}{% render "include", name: name %}')
    expect(actual).to.equal('Jason')
  })

  it('renders the provided snippet with a single variable from the context', async () => {
    const actual = await engine.parseAndRender('{% render "include", name: name %}', { name: 'Jason' })
    expect(actual).to.equal('Jason')
  })

  it('renders the provided snippet with multiple variables', async () => {
    const actual = await engine.parseAndRender('{% render "render-multiple", name: "Jason", login: "JasonEtco" %}')
    expect(actual).to.equal('Jason, JasonEtco')
  })

  it('renders the provided snippet with many variables', async () => {
    const actual = await engine.parseAndRender('{% render "render-many", name: "Jason", login: "JasonEtco", another: "Example", pizza: "pepperoni" %}')
    expect(actual).to.equal('Jason, JasonEtco, Example, pepperoni')
  })

  it('renders the provided snippet with a single object variable', async () => {
    const actual = await engine.parseAndRender('{% render "render-object", user: user %}', { user: { login: 'JasonEtco' } })
    expect(actual).to.equal('JasonEtco')
  })

  it('renders the provided snippet with a single boolean variable', async () => {
    const actual = await engine.parseAndRender('{% render "render-boolean", user: true %}')
    expect(actual).to.equal('User')
  })

  it('does not have access to the external context', async () => {
    const actual = await engine.parseAndRender('{% render "render-context" %}', { externalContext: true })
    expect(actual).to.equal('Nope')
  })

  it('works using the with...as syntax', async () => {
    const actual = await engine.parseAndRender('{% render "render-object" with user as user %}', { user: { login: 'JasonEtco' } })
    expect(actual).to.equal('JasonEtco')
  })

  it('works using the for...as syntax', async () => {
    const context = { users: [{ login: 'JasonEtco' }, { login: 'defunkt' }] }
    const actual = await engine.parseAndRender('{% render "render-object" for users as user %}', context)
    expect(actual).to.equal('JasonEtcodefunkt')
  })

  it('returns an empty string if the value is falsy', async () => {
    const context = { users: undefined }
    const actual = await engine.parseAndRender('{% render "render-object" for users as user %}', context)
    expect(actual).to.equal('')
  })

  it('renders the provided snippet with a quote in a variable', async () => {
    const actual = await engine.parseAndRender('{% render "include", name: \'My name is "Jason"\' %}')
    expect(actual).to.equal('My name is "Jason"')
  })
})
