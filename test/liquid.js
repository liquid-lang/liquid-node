const Liquid = require('..')

describe('Liquid', function () {
  beforeEach(function () { this.engine = new Liquid.Engine() })

  context('parseAndRender', () =>
    it('is supported', function () {
      return expect(this.engine.parseAndRender('{{ foo }}', { foo: 123 })).to.be.fulfilled.then(output => expect(output).to.be.eq('123'))
    })
  )

  context('parser', function () {
    it('parses empty templates', function () {
      return expect(this.engine.parse('')).to.be.fulfilled.then(template => expect(template.root).to.be.instanceOf(Liquid.Document))
    })

    it('parses plain text', function () {
      return expect(this.engine.parse('foo')).to.be.fulfilled.then(template => expect(template.root.nodelist).to.deep.equal(['foo']))
    })

    context('whitespace control', function () {
      it('leaves whitespace as-is', function () {
        return expect(this.engine.parseAndRender('{% unless foo %}\nyes\n{% endunless %}')).to.be.fulfilled.then(output => {
          expect(output).to.equal('\nyes\n')
        })
      })

      it('removes whitespace preceding a `{%- ` tag', function () {
        return expect(this.engine.parseAndRender('{% unless foo %}\nyes\n{%- endunless %}')).to.be.fulfilled.then(output => {
          expect(output).to.equal('\nyes')
        })
      })
      
      it('removes whitespace following a `-%}` tag', function () {
        return expect(this.engine.parseAndRender('{% unless foo -%}\nyes\n{% endunless %}')).to.be.fulfilled.then(output => {
          expect(output).to.equal('yes\n')
        })
      })

      it('removes whitespace preceding and following tags', function () {
        return expect(this.engine.parseAndRender('a\n{%- unless foo -%}\nb\n{%- endunless -%}c')).to.be.fulfilled.then(output => {
          expect(output).to.equal('abc')
        })
      })

      it('works for variable tags', function () {
        return expect(this.engine.parseAndRender('x\n{{- foo -}}\nz', {foo: 'y'})).to.be.fulfilled.then(output => {
          expect(output).to.equal('xyz')
        })
      })
    })

    it('parses variables', function () {
      return expect(this.engine.parse('{{ foo }}')).to.be.fulfilled.then(template => expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Variable))
    })

    it('parses blocks', function () {
      return expect(this.engine.parse('{% for i in c %}{% endfor %}')).to.be.fulfilled.then(template => expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Block))
    })

    it('parses includes', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./'))
      return expect(this.engine.parse("{% include 'test/fixtures/include' %}")).to.be.fulfilled.then(template => expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Include))
    })

    it('parses includes and renders the template with the correct context', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'))
      return expect(this.engine.parseAndRender("{% include 'fixtures/include' %}", { name: 'Josh' })).to.be.fulfilled.then(output => expect(output).to.eq('Josh'))
    })

    it('parses includes with a variable for the path', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./'))
      return expect(this.engine.parse("{% include {{ path }} %}")).to.be.fulfilled.then(template => expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Include))
    })

    it('parses includes with a variable for a path and renders the template with the correct context', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'))
      return expect(this.engine.parseAndRender("{% include {{ path }} %}", { name: 'Josh', path: 'fixtures/include' })).to.be.fulfilled.then(output => expect(output).to.eq('Josh'))
    })

    it('parses includes with a variable for a nested path and renders the template with the correct context', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'))
      return expect(this.engine.parseAndRender("{% include {{ paths.example }} %}", { name: 'Josh', paths: { example: 'fixtures/include' } })).to.be.fulfilled.then(output => expect(output).to.eq('Josh'))
    })

    it('parses nested-includes and renders the template with the correct context', function () {
      this.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'))
      return expect(this.engine.parseAndRender("{% include 'fixtures/subinclude' %}", { name: 'Josh' })).to.be.fulfilled.then(output => expect(output).to.eq('<h1>Josh</h1>'))
    })

    it('parses complex documents', function () {
      return expect(this.engine.parse('{% for i in c %}foo{% endfor %}{{ var }}')).to.be.fulfilled.then(function (template) {
        expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Block)
        expect(template.root.nodelist[0].nodelist).to.deep.equal(['foo'])
        expect(template.root.nodelist[1]).to.be.instanceOf(Liquid.Variable)
        return expect(template.root.nodelist[1].name).to.be.eq('var')
      })
    })

    it('parses for-blocks', function () {
      return expect(this.engine.parse('{% for i in c %}{% endfor %}')).to.be.fulfilled.then(template => expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.For))
    })

    return it('parses capture-blocks', function () {
      return expect(this.engine.parse('{% capture foo %}foo{% endcapture %}')).to.be.fulfilled.then(function (template) {
        expect(template.root.nodelist[0]).to.be.instanceOf(Liquid.Capture)
        return expect(template.root.nodelist[0].nodelist).to.deep.equal(['foo'])
      })
    })
  })

  context('reports error locations', function () {
    it('at beginning of file', function () {
      return expect(this.engine.parse('{% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:1)")
    })

    it('at the beginning of a line', function () {
      return expect(this.engine.parse(' {% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:2)")
    })

    return it('in the middle of a line', function () {
      return expect(this.engine.parse('{{ okay }}\n\n   {% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError,
        "Unknown tag 'illegal'\n    at {% illegal %} (undefined:3:4)")
    })
  })

  return context('template', () =>
    context('.render()', function () {
      it('fails unless parsed', function () {
        const template = new Liquid.Template()
        return expect(template.render()).to.be.rejectedWith(Error, /No document root/)
      })

      it('fails with illegal context', function () {
        return expect(this.engine.parse('foo')).to.be.fulfilled.then(template => expect(template.render(1)).to.be.rejectedWith(Error, /Expected Object or Liquid::Context as parameter/))
      })

      return it('takes a context and options', function () {
        return expect(this.engine.parse('foo')).to.be.fulfilled.then(function (template) {
          const ctx = new Liquid.Context()
          return expect(template.render(ctx, { registers: { x: 3 }, filters: {} })).to.be.fulfilled
        })
      })
    })
  )
})
