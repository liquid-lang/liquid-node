Liquid = require "../liquid"

module.exports = class Context

  constructor: (engine, environments = {}, outerScope = {}, registers = {}, rethrowErrors = false) ->
    @environments = Liquid.Helpers.flatten [environments]
    @scopes = [outerScope]
    @registers = registers
    @errors = []
    @rethrowErrors = rethrowErrors
    @strainer = new engine?.Strainer(@) ? {}
    @squashInstanceAssignsWithEnvironments()

  # Adds filters to this context.
  #
  # Note that this does not register the filters with the main
  # Template object. see <tt>Template.register_filter</tt>
  # for that
  registerFilters: (filters...) ->
    for filter in filters
      for own k, v of filter
        @strainer[k] = v if v instanceof Function

    return

  handleError: (e) ->
    @errors.push e
    throw e if @rethrowErrors

    if e instanceof Liquid.SyntaxError
      "Liquid syntax error: #{e.message}"
    else
      "Liquid error: #{e.message}"

  invoke: (methodName, args...) ->
    method = @strainer[methodName]

    if method instanceof Function
      method.apply @strainer, args
    else
      available = Object.keys @strainer
      throw new Liquid.FilterNotFound "Unknown filter `#{methodName}`, available: [#{available.join(', ')}]"

  push: (newScope = {}) ->
    @scopes.unshift newScope
    throw new Error("Nesting too deep") if @scopes.length > 100

  merge: (newScope = {}) ->
    for own k, v of newScope
      @scopes[0][k] = v

  pop: ->
    throw new Error("ContextError") if @scopes.length <= 1
    @scopes.shift()

  lastScope: ->
    @scopes[@scopes.length - 1]

  # Pushes a new local scope on the stack, pops it at the end of the block
  #
  # Example:
  #   context.stack do
  #      context['var'] = 'hi'
  #   end
  #
  #   context['var]  #=> nil
  stack: (newScope = {}, f) ->
    popLater = false

    try
      if arguments.length < 2
        f = newScope
        newScope = {}

      @push(newScope)
      result = f()

      if result?.nodeify?
        popLater = true
        result.nodeify => @pop()

      result
    finally
      @pop() unless popLater

  clearInstanceAssigns: ->
    @scopes[0] = {}

  # Only allow String, Numeric, Hash, Array, Proc, Boolean
  # or <tt>Liquid::Drop</tt>
  set: (key, value) ->
    @scopes[0][key] = value

  get: (key) ->
    @resolve(key)

  hasKey: (key) ->
    Promise.resolve(@resolve(key)).then (v) -> v?

  # PRIVATE API

  @Literals =
    'null': null
    'nil': null
    '': null
    'true': true
    'false': false

  # Look up variable, either resolve directly after considering the name.
  # We can directly handle Strings, digits, floats and booleans (true,false).
  # If no match is made we lookup the variable in the current scope and
  # later move up to the parent blocks to see if we can resolve
  # the variable somewhere up the tree.
  # Some special keywords return symbols. Those symbols are to be called on the rhs object in expressions
  #
  # Example:
  #   products == empty #=> products.empty?
  resolve: (key) ->
    if Liquid.Context.Literals.hasOwnProperty key
      Liquid.Context.Literals[key]
    else if match = /^'(.*)'$/.exec(key) # Single quoted strings
      match[1]
    else if match = /^"(.*)"$/.exec(key) # Double quoted strings
      match[1]
    else if match = /^(\d+)$/.exec(key) # Integer and floats
      Number(match[1])
    else if match = /^\((\S+)\.\.(\S+)\)$/.exec(key) # Ranges
      lo = @resolve(match[1])
      hi = @resolve(match[2])

      Promise.all([lo, hi]).then ([lo, hi]) ->
        lo = Number lo
        hi = Number hi
        return [] if isNaN(lo) or isNaN(hi)
        new Liquid.Range(lo, hi + 1)

    else if match = /^(\d[\d\.]+)$/.exec(key) # Floats
      Number(match[1])
    else
      @variable(key)

  findVariable: (key) ->
    variableScope = undefined
    variable = undefined

    @scopes.some (scope) ->
      if scope.hasOwnProperty key
        variableScope = scope
        true

    unless variableScope?
      @environments.some (env) =>
        variable = @lookupAndEvaluate env, key
        variableScope = env if variable?

    unless variableScope?
      if @environments.length > 0
        variableScope = @environments[@environments.length - 1]
      else if @scopes.length > 0
        variableScope = @scopes[@scopes.length - 1]
      else
        throw new Error "No scopes to find variable in."

    variable ?= @lookupAndEvaluate(variableScope, key)

    Promise.resolve(variable).then (v) => @liquify v

  variable: (markup) ->
    Promise.resolve().then =>
      parts = Liquid.Helpers.scan(markup, Liquid.VariableParser)
      squareBracketed = /^\[(.*)\]$/

      firstPart = parts.shift()

      if match = squareBracketed.exec(firstPart)
        firstPart = match[1]

      object = @findVariable(firstPart)
      return object if parts.length is 0

      mapper = (part, object) =>
        return Promise.resolve(object) unless object?

        Promise.resolve(object).then(@liquify.bind(@)).then (object) =>
          return object unless object?

          bracketMatch = squareBracketed.exec part
          part = @resolve(bracketMatch[1]) if bracketMatch

          Promise.resolve(part).then (part) =>
            isArrayAccess = (Array.isArray(object) and isFinite(part))
            isObjectAccess = (object instanceof Object and (object.hasKey?(part) or part of object))
            isSpecialAccess = (
              !bracketMatch and object and
              (Array.isArray(object) or Object::toString.call(object) is "[object String]") and
              ["size", "first", "last"].indexOf(part) >= 0
            )

            if isArrayAccess or isObjectAccess
              # If object is a hash- or array-like object we look for the
              # presence of the key and if its available we return it
              Promise.resolve(@lookupAndEvaluate(object, part)).then(@liquify.bind(@))
            else if isSpecialAccess
              # Some special cases. If the part wasn't in square brackets
              # and no key with the same name was found we interpret
              # following calls as commands and call them on the
              # current object
              switch part
                when "size"
                  @liquify(object.length)
                when "first"
                  @liquify(object[0])
                when "last"
                  @liquify(object[object.length - 1])
                else
                  ### @covignore ###
                  throw new Error "Unknown special accessor: #{part}"

      # The iterator walks through the parsed path step
      # by step and waits for promises to be fulfilled.
      iterator = (object, index) ->
        if index < parts.length
          mapper(parts[index], object).then (object) -> iterator(object, index + 1)
        else
          Promise.resolve(object)

      iterator(object, 0).catch (err) ->
        throw new Error "Couldn't walk variable: #{markup}: #{err}"

  lookupAndEvaluate: (obj, key) ->
    if obj instanceof Liquid.Drop
      obj.get(key)
    else
      obj?[key]

  squashInstanceAssignsWithEnvironments: ->
    lastScope = @lastScope()

    Object.keys(lastScope).forEach (key) =>
      @environments.some (env) =>
        if env.hasOwnProperty key
          lastScope[key] = @lookupAndEvaluate env, key
          true

  liquify: (object) ->
    Promise.resolve(object).then (object) =>
      unless object?
        return object
      else if typeof object.toLiquid is "function"
        object = object.toLiquid()
      else if typeof object is "object"
        true # throw new Error "Complex object #{JSON.stringify(object)} would leak into template."
      else if typeof object is "function"
        object = ""
      else
        Object::toString.call object

      object.context = @ if object instanceof Liquid.Drop
      object
