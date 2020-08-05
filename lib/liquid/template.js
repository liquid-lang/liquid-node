const slice = [].slice
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')

module.exports = Liquid.Template = (function () {
  function Template () {
    this.registers = {}
    this.assigns = {}
    this.instanceAssigns = {}
    this.tags = {}
    this.errors = []
    this.rethrowErrors = true
  }

  Template.prototype.parse = function (engine, source, original) {
    this.engine = engine
    if (!source) {
      source = ''
    }

    if (!original) {
      original = source
    }

    let tags

    // Multiline If
    //
    // It's perfectly valid to do:
    //
    // {% if
    //    thing = value
    //    or thing = value 2
    // %}
    //   foo
    // {$ endif %}
    //
    // This means that we need to process the string in a similar
    // way to how we processed the multi line tags
    if (tags = source.match(Liquid.MultiLineIf)) {
      for (tag in tags) {
        let match = tags[tag]

        let replacement = match
          .replace(/{([%|\{]-? if\n\s*)(.*?)(-?[%|\}]\})/gs, 'if $2')
          .replace(/^\s*/gm, '')
          .replace(/^(.*?)(\{%\ )(.*?)\ %\}(.*)/gs, '$3')
          .replace(/^(.*[^\n])$/gm, '{%- $1 -%}')

        source = source.replace(tags[tag], replacement)
      }
    }

    // Multi Line Support
    //
    // This:
    //
    // {% liquid
    // case section.blocks.size
    // when 1
    //   assign column_size = ''
    // when 2
    //   assign column_size = 'one-half'
    // when 3
    //   assign column_size = 'one-third'
    // else
    //   assign column_size = 'one-quarter'
    // endcase %}
    //
    // Becomes:
    //
    // {% liquid %} // This does not get removed: we keep line numbers
    // {% case section.blocks.size %}
    // {% when 1 %}
    // {%   assign column_size = '' %}
    // {% when 2 %}
    // {%   assign column_size = 'one-half' %}
    // {% when 3 %}
    // {%   assign column_size = 'one-third' %}
    // {% else %}
    // {%   assign column_size = 'one-quarter' %}
    // {% endcase %}
    //
    // This happens before we filter whitespace so
    // that we can check all the values in a multi line
    // tag.
    if (tags = source.match(Liquid.MultiLineTag)) {
      for (tag in tags) {
        let match = tags[tag]

        let replacement = match
          .replace(/^(.*?)(\{%\ )(.*?)\ %\}(.*)/gs, '$3')
          .replace(/^(.*[^\n])$/gm, '{% $1 %}')

        source = source.replace(tags[tag], replacement)
      }
    }

    // Whitespace Control
    //
    // In Liquid, you can include a hyphen in your tag syntax {{-, -}}, {%-, and -%} 
    // to strip whitespace from the left or right side of a rendered tag.
    //
    // https://shopify.github.io/liquid/basics/whitespace/
    filteredsource = source
      .replace(Liquid.WhitespaceStartCapture, '$2')
      .replace(Liquid.WhitespaceEndCapture, '$1')

    return Promise.resolve().then((function (_this) {
      return function () {
        var tokens
        // These are the original, pre-whitespace stripped tokens
        tokens = _this._tokenize(source)
        // These are the post processed, whitespace stripped tokens
        filteredtokens = _this._tokenize(filteredsource)
        _this.tags = _this.engine.tags
        _this.root = new Liquid.Document(_this)
        // We pass in the original tokens in order to correctly display
        // the real line number on multi-line whitespace removals
        return _this.root.parseWithCallbacks(filteredtokens, tokens).then(function () {
          return _this
        })
      }
    })(this))
  }

  Template.prototype.render = function () {
    var args
    args = arguments.length >= 1 ? slice.call(arguments, 0) : []
    return Promise.resolve().then((function (_this) {
      return function () {
        return _this._render.apply(_this, args)
      }
    })(this))
  }

  Template.prototype._render = function (assigns, options) {
    var context, copyErrors, k, ref, v // eslint-disable-line
    if (this.root == null) {
      throw new Error('No document root. Did you parse the document yet?')
    }
    context = (function () {
      if (assigns instanceof Liquid.Context) {
        return assigns
      } else if (assigns instanceof Object) {
        assigns = [assigns, this.assigns]
        return new Liquid.Context(this.engine, assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
      } else if (assigns == null) {
        return new Liquid.Context(this.engine, this.assigns, this.instanceAssigns, this.registers, this.rethrowErrors)
      } else {
        throw new Error('Expected Object or Liquid::Context as parameter, but was ' + (typeof assigns) + '.')
      }
    }.call(this))
    if (options != null ? options.registers : void 0) {
      ref = options.registers
      for (k in ref) {
        if (!hasProp.call(ref, k)) continue
        v = ref[k]
        this.registers[k] = v
      }
    }
    if (options != null ? options.filters : void 0) {
      context.registerFilters.apply(context, options.filters)
    }
    copyErrors = (function (_this) {
      return function (actualResult) {
        _this.errors = context.errors
        return actualResult
      }
    })(this)
    return this.root.render(context).then(function (chunks) {
      return Liquid.Helpers.toFlatString(chunks)
    }).then(function (result) {
      this.errors = context.errors
      return result
    }, function (error) {
      this.errors = context.errors
      throw error
    })
  }

  Template.prototype._tokenize = function (source) {
    var col, line, tokens
    source = String(source)
    if (source.length === 0) {
      return []
    }
    tokens = source.split(Liquid.TemplateParser)
    line = 1
    col = 1
    return tokens.filter(function (token) {
      return token.length > 0
    }).map(function (value) {
      var lastIndex, linebreaks, result
      result = {
        value: value,
        col: col,
        line: line
      }
      lastIndex = value.lastIndexOf('\n')
      if (lastIndex < 0) {
        col += value.length
      } else {
        linebreaks = value.split('\n').length - 1
        line += linebreaks
        col = value.length - lastIndex
      }
      return result
    })
  }

  return Template
})()
