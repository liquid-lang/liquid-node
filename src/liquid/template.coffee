Liquid = require "../liquid"

module.exports = class Liquid.Template

  # creates a new <tt>Template</tt> from an array of tokens.
  # Use <tt>Template.parse</tt> instead
  constructor: ->
    @registers = {}
    @assigns = {}
    @instanceAssigns = {}
    @tags = {}
    @errors = []
    @rethrowErrors = true

  # Parse source code.
  # Returns self for easy chaining
  parse: (@engine, source = "") ->
    Promise.resolve().then =>
      tokens = @_tokenize source

      @tags = @engine.tags
      @root = new Liquid.Document @
      @root.parseWithCallbacks(tokens).then => @

  # Render takes a hash with local variables.
  #
  # if you use the same filters over and over again consider
  # registering them globally
  # with <tt>Template.register_filter</tt>
  #
  # Following options can be passed:
  #
  #  * <tt>filters</tt> : array with local filters
  #  * <tt>registers</tt> : hash with register variables. Those can
  #    be accessed from filters and tags and might be useful to integrate
  #    liquid more with its host application
  #
  render: (args...) ->
    Promise.resolve().then => @_render args...

  _render: (assigns, options) ->
    throw new Error "No document root. Did you parse the document yet?" unless @root?

    context = if assigns instanceof Liquid.Context
      assigns
    else if assigns instanceof Object
      assigns = [assigns, @assigns]
      new Liquid.Context @engine, assigns, @instanceAssigns, @registers, @rethrowErrors
    else if not assigns?
      new Liquid.Context @engine, @assigns, @instanceAssigns, @registers, @rethrowErrors
    else
      throw new Error "Expected Object or Liquid::Context as parameter, but was #{typeof assigns}."

    if options?.registers
      for own k, v of options.registers
        @registers[k] = v

    if options?.filters
      context.registerFilters options.filters...

    copyErrors = (actualResult) =>
      @errors = context.errors
      actualResult

    @root.render(context)
    .then (chunks) ->
      Liquid.Helpers.toFlatString chunks
    .then (result) ->
      @errors = context.errors
      result
    , (error) ->
      @errors = context.errors
      throw error

  # Uses the <tt>Liquid::TemplateParser</tt> regexp to tokenize
  # the passed source
  _tokenize: (source) ->
    source = String source
    return [] if source.length is 0
    tokens = source.split Liquid.TemplateParser

    line = 1
    col = 1

    tokens
    .filter (token) ->
      token.length > 0
    .map (value) ->
      result = { value, col, line }

      lastIndex = value.lastIndexOf "\n"

      if lastIndex < 0
        col += value.length
      else
        linebreaks = value.split("\n").length - 1
        line += linebreaks
        col = value.length - lastIndex

      result
