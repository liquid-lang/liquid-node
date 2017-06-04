import { Liquid, expect } from './_helper';

describe('Liquid', () => {
  const self = this || {};
  beforeEach(() => {
    self.engine = new Liquid.Engine();
  });
  context('parseAndRender', () => it('is supported', () => {
    expect(self.engine.parseAndRender('{{ foo }}', { foo: 123 })).to.be.fulfilled
        .then(output => expect(output).to.be.eq('123'));
  }));
  context('parser', () => {
    it('parses empty templates', () => {
      expect(self.engine.parse('')).to.be.fulfilled.then(({ root }) => expect(root).to.be.instanceOf(Liquid.Document));
    });
    it('parses plain text', () => {
      expect(self.engine.parse('foo')).to.be.fulfilled.then(({ root }) => expect(root.nodelist).to.deep.equal(['foo']));
    });
    it('parses variables', () => {
      expect(self.engine.parse('{{ foo }}')).to.be.fulfilled.then(({ root }) => expect(root.nodelist[0]).to.be.instanceOf(Liquid.Variable));
    });
    it('parses blocks', () => {
      expect(self.engine.parse('{% for i in c %}{% endfor %}')).to.be.fulfilled.then(({ root }) => expect(root.nodelist[0]).to.be.instanceOf(Liquid.Block));
    });
    it('parses includes', () => {
      self.engine.registerFileSystem(new Liquid.LocalFileSystem('./'));
      expect(self.engine.parse("{% include 'test/fixtures/include' %}")).to.be.fulfilled.then(({ root }) => expect(root.nodelist[0]).to.be.instanceOf(Liquid.Include));
    });
    it('parses includes and renders the template with the correct context', () => {
      self.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'));
      expect(self.engine.parseAndRender("{% include 'fixtures/include' %}", {
        name: 'Josh',
      })).to.be.fulfilled.then(output => expect(output).to.eq('Josh'));
    });
    it('parses nested-includes and renders the template with the correct context', () => {
      self.engine.registerFileSystem(new Liquid.LocalFileSystem('./test'));
      expect(self.engine.parseAndRender("{% include 'fixtures/subinclude' %}", {
        name: 'Josh',
      })).to.be.fulfilled.then(output => expect(output).to.eq('<h1>Josh</h1>'));
    });
    it('parses complex documents', () => {
      expect(self.engine.parse('{% for i in c %}foo{% endfor %}{{ var }}')).to.be.fulfilled.then(({ root }) => {
        expect(root.nodelist[0]).to.be.instanceOf(Liquid.Block);
        expect(root.nodelist[0].nodelist).to.deep.equal(['foo']);
        expect(root.nodelist[1]).to.be.instanceOf(Liquid.Variable);
        expect(root.nodelist[1].name).to.be.eq('var');
      });
    });
    it('parses for-blocks', () => {
      expect(self.engine.parse('{% for i in c %}{% endfor %}')).to.be.fulfilled.then(({ root }) => expect(root.nodelist[0]).to.be.instanceOf(Liquid.For));
    });
    it('parses capture-blocks', () => {
      expect(self.engine.parse('{% capture foo %}foo{% endcapture %}')).to.be.fulfilled.then(({ root }) => {
        expect(root.nodelist[0]).to.be.instanceOf(Liquid.Capture);
        expect(root.nodelist[0].nodelist).to.deep.equal(['foo']);
      });
    });
  });
  context('reports error locations', () => {
    it('at beginning of file', () => {
      expect(self.engine.parse('{% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError, "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:1)");
    });
    it('at the beginning of a line', () => {
      expect(self.engine.parse(' {% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError, "Unknown tag 'illegal'\n    at {% illegal %} (undefined:1:2)");
    });
    it('in the middle of a line', () => {
      expect(self.engine.parse('{{ okay }}\n\n   {% illegal %}')).to.be.rejectedWith(Liquid.SyntaxError, "Unknown tag 'illegal'\n    at {% illegal %} (undefined:3:4)");
    });
  });
  context('template', () => context('.render()', () => {
    it('fails unless parsed', () => {
      const template = new Liquid.Template();
      expect(template.render()).to.be.rejectedWith(Error, /No document root/);
    });
    it('fails with illegal context', () => {
      expect(self.engine.parse('foo')).to.be.fulfilled.then(template => expect(template.render(1)).to.be.rejectedWith(Error, /Expected Object or Liquid::Context as parameter/));
    });
    it('takes a context and options', () => {
      expect(self.engine.parse('foo')).to.be.fulfilled.then((template) => {
        const ctx = new Liquid.Context();
        expect(template.render(ctx, {
          registers: {
            x: 3,
          },
          filters: {},
        })).to.be.fulfilled();
      });
    });
  }));
});
