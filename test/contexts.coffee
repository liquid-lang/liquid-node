Liquid = requireLiquid()

describe "Context", ->
  beforeEach -> @ctx = new Liquid.Context()

  context ".handleError", ->
    it "throws errors if enabled", ->
      @ctx.rethrowErrors = true

      expect =>
        @ctx.handleError(new Error "hello")
      .to.throw /hello/

    it "prints errors", ->
      expect(@ctx.handleError(new Error "hello")).to.match /Liquid error/

    it "prints syntax errors", ->
      expect(@ctx.handleError(new Liquid.SyntaxError "hello")).to.match /Liquid syntax error/

  context ".push", ->
    it "pushes scopes", ->
      scope = {}
      @ctx.push scope
      expect(@ctx.pop()).to.equal scope

    it "pushes an empty scope by default", ->
      @ctx.push()
      expect(@ctx.pop()).to.deep.equal {}

    it "limits levels", ->
      expect =>
        @ctx.push() for i in [0..150]
      .to.throw /Nesting too deep/

  context ".pop", ->
    it "throws an exception if no scopes are left to pop", ->
      expect =>
        @ctx.pop()
      .to.throw /ContextError/

  context ".stack", ->
    it "automatically pops scopes", ->
      mySpy = sinon.spy()
      @ctx.stack null, mySpy

      expect(mySpy).to.have.been.calledOnce
      expect(@ctx.scopes.length).to.equal 1

  context ".merge", ->
    it "merges scopes", ->
      @ctx.push x: 1, y: 2
      @ctx.merge y: 3, z: 4
      expect(@ctx.pop()).to.deep.equal x: 1, y: 3, z: 4

    it "merges null-scopes", ->
      @ctx.push x: 1
      @ctx.merge()
      expect(@ctx.pop()).to.deep.equal x: 1

  context ".resolve", ->
    it "resolves strings", ->
      expect(@ctx.resolve("'42'")).to.equal "42"
      expect(@ctx.resolve('"42"')).to.equal "42"

    it "resolves numbers", ->
      expect(@ctx.resolve("42")).to.equal 42
      expect(@ctx.resolve("3.14")).to.equal 3.14

    it "resolves illegal ranges", ->
      expect(@ctx.resolve("(0..a)")).to.become []

  context ".clearInstanceAssigns", ->
    it "clears current scope", ->
      scope = x: 1
      @ctx.push scope
      @ctx.clearInstanceAssigns()
      expect(@ctx.pop()).to.deep.equal {}

  context ".hasKey", ->
    it "checks for variable", ->
      @ctx.push a: 0
      @ctx.push b: 1
      @ctx.push c: true

      expect(@ctx.hasKey("a")).to.become.ok
      expect(@ctx.hasKey("b")).to.become.ok
      expect(@ctx.hasKey("c")).to.become.ok

      expect(@ctx.hasKey("z")).not.to.become.ok

  context ".variable", ->
    it "supports special access", ->
      @ctx.push a: [1,99]
      expect(@ctx.variable("a.first")).to.become 1
      expect(@ctx.variable("a.size")).to.become 2
      expect(@ctx.variable("a.last")).to.become 99

    it "supports strict variables", ->
      @ctx.strictVariables = true
      expect(@ctx.variable("missing")).to.be.rejectedWith 'Error - variable \'missing\' is undefined.'
