const Liquid = require('../liquid')

module.exports = class Template {
  constructor () {
    this.registers = {}
    this.assigns = {}
    this.instanceAssigns = {}
    this.tags = {}
    this.errors = []
    this.rethrowErrors = true
  }

  async parse (engine, source = '') {
    this.engine = engine

    // whitespace control
    //
    // In Liquid, you can include a hyphen in your tag syntax {{-, -}}, {%-, and -%}
    // to strip whitespace from the left or right side of a rendered tag.
    // https://shopify.github.io/liquid/basics/whitespace/
    source = source
      .replace(/\n.*?(\{%)-/g, '$1') // tag starting with {%-
      .replace(/-(%\}).*?\n/g, '$1') // tag ending with -%}
      .replace(/\n.*?(\{\{)-/g, '$1') // tag starting with {{-
      .replace(/-(}\}).*?\n/g, '$1') // tag ending with -}}

    const tokens = this._tokenize(source)
    this.tags = this.engine.tags
    this.root = new Liquid.Document(this)
    await this.root.parseWithCallbacks(tokens)
    return this
  }

  async render (assigns, options) {
    if (!this.root) {
      throw new Error('No document root. Did you parse the document yet?')
    }

    let context
    if (assigns instanceof Liquid.Context) {
      context = assigns
    } else if (assigns instanceof Object) {
      assigns = [assigns, this.assigns]
      context = new Liquid.Context(this.engine, assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
    } else if (assigns == null) {
      context = new Liquid.Context(this.engine, this.assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
    } else {
      throw new Error('Expected Object or Liquid::Context as parameter, but was ' + (typeof assigns) + '.')
    }

    if (options && options.registers) {
      const ref = options.registers
      for (const key in ref) {
        if (!Object.prototype.hasOwnProperty.call(ref, key)) continue
        const value = ref[key]
        this.registers[key] = value
      }
    }

    if (options && options.filters) {
      context.registerFilters.apply(context, options.filters)
    }

    const chunks = await this.root.render(context)

    try {
      const result = await Liquid.Helpers.toFlatString(chunks)
      this.errors = context.errors
      return result
    } catch (err) {
      this.errors = context.errors
      throw err
    }
  }

  _tokenize (source) {
    source = String(source)
    if (source.length === 0) {
      return []
    }

    const tokens = source
      .split(Liquid.TemplateParser)
      .filter(token => token.length > 0)

    let line = 1
    let col = 1

    return tokens.map(value => {
      const result = { value, col, line }
      const lastIndex = value.lastIndexOf('\n')

      if (lastIndex < 0) {
        col += value.length
      } else {
        const linebreaks = value.split('\n').length - 1
        line += linebreaks
        col = value.length - lastIndex
      }

      return result
    })
  }
}
