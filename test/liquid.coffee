Liquid = requireLiquid()

describe "Liquid", ->
  beforeEach -> @engine = new Liquid.Engine

  context "parseAndRender", ->
    it "is supported", ->
      expect(@engine.parseAndRender("{{ foo }}", foo: 123)).to.be.fulfilled.then (output) ->
        expect(output).to.be.eq "123"

  context "parser", ->
    it "parses empty templates", ->
      expect(@engine.parse("")).to.be.fulfilled.then (template) ->
        expect(template.root).to.be.instanceOf Liquid.Document

    it "parses plain text", ->
      expect(@engine.parse("foo")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist).to.deep.equal ["foo"]

    it "parses variables", ->
      expect(@engine.parse("{{ foo }}")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist[0]).to.be.instanceOf Liquid.Variable

    it "parses blocks", ->
      expect(@engine.parse("{% for i in c %}{% endfor %}")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist[0]).to.be.instanceOf Liquid.Block

    context "includes", ->
      it "parses includes", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./"
        expect(@engine.parse("{% include 'test/fixtures/include' %}")).to.be.fulfilled.then (template) ->
          expect(template.root.nodelist[0]).to.be.instanceOf Liquid.Include

      it "parses includes and renders the template with the correct context", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/include' %}", { name: 'Josh'})).to.be.fulfilled.then (output) ->
          expect(output).to.eq "Josh"

      it "parses nested-includes and renders the template with the correct context", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/subinclude' %}", { name: 'Josh'})).to.be.fulfilled.then (output) ->
          expect(output).to.eq "<h1>Josh</h1>"

      it "parses includes with local variables", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/include' name: 'Josh' %}")).to.be.fulfilled.then (output) ->
          expect(output).to.eq "Josh"

      it "parses includes with local variables but does not pollute the current scope", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/include' name: 'Josh' %}{{name}}")).to.be.fulfilled.then (output) ->
          expect(output).to.eq "Josh"

      it "parses nested-includes rendered with local variables", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/subinclude' name: 'Josh' %}")).to.be.fulfilled.then (output) ->
          expect(output).to.eq "<h1>Josh</h1>"

      it "parses includes with multiple local variables", ->
        @engine.registerFileSystem new Liquid.LocalFileSystem "./test"
        expect(@engine.parseAndRender("{% include 'fixtures/include_multiple', name: 'Josh', age: 19 %}")).to.be.fulfilled.then (output) ->
          expect(output).to.eq "Josh aged 19"


    it "parses complex documents", ->
      expect(@engine.parse("{% for i in c %}foo{% endfor %}{{ var }}")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist[0]).to.be.instanceOf Liquid.Block
        expect(template.root.nodelist[0].nodelist).to.deep.equal ["foo"]
        expect(template.root.nodelist[1]).to.be.instanceOf Liquid.Variable
        expect(template.root.nodelist[1].name).to.be.eq "var"

    it "parses for-blocks", ->
      expect(@engine.parse("{% for i in c %}{% endfor %}")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist[0]).to.be.instanceOf Liquid.For

    it "parses capture-blocks", ->
      expect(@engine.parse("{% capture foo %}foo{% endcapture %}")).to.be.fulfilled.then (template) ->
        expect(template.root.nodelist[0]).to.be.instanceOf Liquid.Capture
        expect(template.root.nodelist[0].nodelist).to.deep.equal ["foo"]

  context "reports error locations", ->
    it "at beginning of file", ->
      expect(@engine.parse("{% illegal %}")).to.be.rejectedWith Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:1)"

    it "at the beginning of a line", ->
      expect(@engine.parse(" {% illegal %}")).to.be.rejectedWith Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:2)"

    it "in the middle of a line", ->
      expect(@engine.parse("{{ okay }}\n\n   {% illegal %}")).to.be.rejectedWith Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:3:4)"

  context "template", ->
    context ".render()", ->
      it "fails unless parsed", ->
        template = new Liquid.Template()
        expect(template.render()).to.be.rejectedWith Error, /No document root/

      it "fails with illegal context", ->
        expect(@engine.parse("foo")).to.be.fulfilled.then (template) ->
          expect(template.render(1)).to.be.rejectedWith Error, /Expected Object or Liquid::Context as parameter/

      it "takes a context and options", ->
        expect(@engine.parse("foo")).to.be.fulfilled.then (template) ->
          ctx = new Liquid.Context
          expect(template.render(ctx, { registers: { x: 3 }, filters: {} })).to.be.fulfilled
