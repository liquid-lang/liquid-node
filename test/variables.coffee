Liquid = requireLiquid()
util = require "util"

describe "Liquid.Variable", ->
  it "is parsed", ->
    variable = new Liquid.Variable('hello')
    expect(variable.name).to.equal 'hello'

  it "parses filters", ->
    v = new Liquid.Variable('hello | textileze')
    expect('hello').to.equal v.name
    expect([["textileze",[]]]).to.deep.equal v.filters

  it "parses multiple filters", ->
    v = new Liquid.Variable('hello | textileze | paragraph')
    expect('hello').to.equal v.name
    expect([["textileze",[]], ["paragraph",[]]]).to.deep.equal v.filters

  it "parses filters with arguments", ->
    v = new Liquid.Variable("""hello | strftime: '%Y'""")
    expect('hello').to.equal v.name
    expect([["strftime",["'%Y'"]]]).to.deep.equal v.filters

  it "parses filters with a string-argument that contains an argument-separator", ->
    v = new Liquid.Variable("""hello | strftime: '%Y, okay?'""")
    expect('hello').to.equal v.name
    expect([["strftime",["'%Y, okay?'"]]]).to.deep.equal v.filters

  it "parses filters with date formatting parameter", ->
    v = new Liquid.Variable(""" '2006-06-06' | date: "%m/%d/%Y" """)
    expect("'2006-06-06'").to.equal v.name
    expect([["date",["\"%m/%d/%Y\""]]]).to.deep.equal v.filters

  describe "with multiple arguments", ->
    it "parses ", ->
      v = new Liquid.Variable("""'typo' | link_to: 'Typo', true""")
      expect("""'typo'""").to.equal v.name
      expect([["link_to",["'Typo'", "true"]]]).to.deep.equal v.filters

    it "parses", ->
      v = new Liquid.Variable("""'typo' | link_to: 'Typo', false""")
      expect("""'typo'""").to.equal v.name
      expect([["link_to",["'Typo'", "false"]]]).to.deep.equal v.filters

    it "parses", ->
      v = new Liquid.Variable("""'foo' | repeat: 3""")
      expect("""'foo'""").to.equal v.name
      expect([["repeat",["3"]]]).to.deep.equal v.filters

    it "parses", ->
      v = new Liquid.Variable("""'foo' | repeat: 3, 3""")
      expect("""'foo'""").to.equal v.name
      expect([["repeat",["3","3"]]]).to.deep.equal v.filters

    it "parses", ->
      v = new Liquid.Variable("""'foo' | repeat: 3, 3, 3""")
      expect("""'foo'""").to.equal v.name
      expect([["repeat",["3","3","3"]]]).to.deep.equal v.filters

    it "parses when a string-argument contains an argument-separator", ->
      v = new Liquid.Variable(""" hello | things: "%Y, okay?", 'the other one'""")
      expect('hello').to.equal v.name
      expect([["things",["\"%Y, okay?\"","'the other one'"]]]).to.deep.equal v.filters

  it "renders", ->
    renderTest 'worked', '{{ test }}', test:'worked'

  it "renders when empty", ->
    renderTest '', '{{ }}'

  it "allows ranges", ->
    renderTest '1-2-3', '{{ (1..3) | join:"-" }}'

  it "throws for undefined when strict", () ->
    variable = new Liquid.Variable "test"
    context = new Liquid.Context
    context.strictVariables = true
    expect(variable.render(context)).to.be.rejectedWith 'Error - variable \'test\' is undefined.'

  context "with filter", ->
    it "renders", ->
      MoneyFilter =
        money: (input) -> util.format ' $%d ', input
        money_with_underscore: (input) -> util.format ' $%d ', input

      context = new Liquid.Context
      context.set 'var', 1000
      context.registerFilters MoneyFilter

      variable = new Liquid.Variable "var | money"
      variable.render(context).then (result) ->
        expect(result).to.equal ' $1000 '

    it "renders empty string", ->
      renderTest '', '{{ test | append: "" }}', {}

    it "renders on unknown filter", ->
      renderTest /filter 'doesNotExist' in ' 1 \| doesNotExist ' could not be found/, '{{ 1 | doesNotExist }}', {}, false

  # TODO: This doesn't work yet.
  it.skip "prevents 'RangeError: Maximum call stack size exceeded'", ->
    doc = "{{ a"
    doc += ".a" while doc.length < (1024 * 1024)
    doc += ".b"
    doc += " }}"

    a = {}
    a.a = -> a
    a.b = -> "STOP"

    renderTest "STOP", doc, a: a
