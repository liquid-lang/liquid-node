PROMISE_API = ['asap', 'then', 'always', 'done', 'fail', 'progress', 'timeout', 'pipe', 'when', 'status']

async =
  debug: false

  parallel:
    forEach: (array, callback) ->
      async.promise (p) ->
        p.resolve()

    map: (array, callback) ->
      async.promise (p) ->
        result = []
        total = 0
        done = false

        array.forEach (item, index) ->
          total++
          async.when(callback(item, index, array))
            .done (item) ->
              result[index] = item
              total--
              p.resolve(result) if done and total == 0
            .fail ->
              p.reject arguments...

        done = true
        p.resolve(result) if total == 0

  # Resolves when all items are resolved.
  forEach: (array, callback) ->
    sequence = async.when(true)
    array.forEach (item) -> sequence.when(-> callback(item))
    sequence

  # Resolves with the mapped array once all items are resolved.
  # Rejects if any item rejects.
  map: (array, callback) ->
    async.promise (p) ->
      result = []

      sequence = async.when(true)

      array.forEach (item, index) ->
        sequence = sequence
          .when(-> callback(item, index, array))
          .done((v) -> result[index] = v)

      sequence.done -> p.resolve(result)
      sequence.fail -> p.reject(arguments...)

  reduce: (array, callback, initialValue) ->
    previousValue = async.when(initialValue)

    array.forEach (item) ->
      previousValue = previousValue.when((prev) -> callback(prev, item))

    previousValue

  some: (array, callback) ->
    O = Object(array)
    len = O.length >>> 0

    throw new TypeError() if typeof fun is not "function"

    async.promise (p) ->
      _next = (k) ->
        if k >= len
          return p.resolve(false)

        if k of array
          kValue = array[k]
          async.when(callback(kValue))
            .done (test) -> if test then p.resolve(true) else _next(k+1)
            .fail(p.reject)
        else
          _next(k+1)

      _next(0)

  detect: (array, callback) ->
    async.promise (p) ->
      async.some array, (item) ->
          async.when(callback(item))
            .when (test) ->
              p.resolve(item) if test
        .done (test) ->
          p.resolve(false) unless test
        .fail(p.resolve)

  defer: ->
    new Deferred()

  promise: (callback) ->
    #try
      deferred = async.defer()
      callback(deferred)
      deferred.promise()
    #catch e
    #  deferred = async.defer()
    #  deferred.reject(e)
    #  deferred

  when: (v) ->
    if async.isPromise(v)
      v
    else
      deferred = async.defer()
      deferred.resolve(v)
      deferred.promise()

  join: (promises...) ->
    async.parallel.forEach(promises, (item) -> item)

  isPromise: (v) ->
    v and v.isPromise

class Promise
  isPromise: true

class Deferred
  constructor: ->

    # Private API

    progressHandlers = []
    resultHandlers = []
    results = []

    done = resolved = rejected = false
    cachedPromise = timeoutHandle = dirtyHandle = error = undefined

    markDirty = =>
      return unless done
      return if dirtyHandle

      dirtyHandle = setTimeout(notify, 0)

    notify = =>
      throw new Error("Not done yet.") unless done

      # clear dirty
      clearTimeout(dirtyHandle) if dirtyHandle
      dirtyHandle = undefined

      while handler = resultHandlers.shift()
        try
          if handler.always or (rejected and handler.onReject)
            handler.callback.call(@, error, results...)
          else if resolved and handler.onResolve
            handler.callback.apply(@, results)
        catch e
          if async.debug
            setTimeout((-> throw e), 0) # let this fail on the event-loop
          else
            console.log "Failed to execute handler: %s", e


      @

    @status = =>
      if resolved
        "resolved"
      else if rejected
        "rejected"
      else
        "pending"

    @inspect = =>
      "Promise status=#{@status()}, error=#{error}"

    @toJSON = =>
      {
        isPromise: true
        status: @status(),
        error: error
        results: results
      }

    @promise = =>
      cachedPromise or= do =>
        result = new Promise()
        PROMISE_API.forEach (f) => result[f] = @[f]
        result.inspect = -> "ViewOf" + @inspect()
        result.toJSON = @toJSON
        result

    @asap = =>
      isAsap = true
      @

    @then = @always = (callback) =>
      resultHandlers.push { callback: callback, always: true }
      markDirty()
      @

    @done = (callback) =>
      resultHandlers.push { callback: callback, onResolve: true }
      markDirty()
      @

    @fail = (callback) =>
      resultHandlers.push { callback: callback, onReject: true }
      markDirty()
      @

    @progress = (callback) =>
      progressHandlers.push { callback: callback }
      @

    @timeout = (delay) =>
      clearTimeout(timeoutHandle) if timeoutHandle

      timeout = =>
        unless done and timeoutHandle
          @reject("time-out: #{delay}ms")


      timeoutHandle = setTimeout(timeout, delay)
      @always -> clearTimeout(timeoutHandle)

    @pipe = (promise) =>
      @done -> promise.resolve(arguments...)
      @fail -> promise.reject(arguments...)

    @when = (callback) =>
      async.promise (p) =>
        @fail =>
          p.reject(arguments...)

        @done =>
          try
            result = callback(arguments...)
          catch e
            console.log e.stack
            return p.reject(e)

          if async.isPromise(result)
            result.pipe(p)
          else
            p.resolve(result)

    @drain = (other) =>
      if async.isPromise(other)
        other.pipe(@)
      else
        @resolve(other)

    @reject = (_error, _results...) =>
      throw new Error("Promise was already done.") if done
      done = rejected = true
      error = _error
      results = _results
      notify()
      @

    @resolve = (_results...) =>
      throw new Error("Promise was already done.") if done
      done = resolved = true
      results = _results
      notify()
      @

    @node = (error, args...) =>
      if error
        @reject(arguments...)
      else
        @resolve(args...)

    @now = =>
      notify()
      @

    @tryUnwrap = =>
      now()

      if done
        @eval()
      else
        @

    @eval = =>
      if resolved
        _results[0]
      else if rejected
        throw error
      else
        throw new Error("This Promise wasn't resolved yet.")

  @

module.exports = async
###

delay = (timespan, action) ->
  async.promise (p) ->
    later = ->
      p.resolve(action())
    setTimeout(later, timespan)

aPost = ->
  return {
    getAuthor: ->
      async.promise (p) ->
        setTimeout(
          (-> p.resolve({ name: "Albert" })),
          0
        )
  }

getPosts = ->
  async.promise (p) ->
    setTimeout(
      (-> p.resolve([aPost()])),
      10
    )

reducer = (prev, next) ->
  if next == 0 then throw new Error("Division by zero.")
  delay 0, -> prev / next

async.reduce([2, 5, 10], reducer, 100).done(-> console.log arguments)
async.reduce([2, 5,  0], reducer, 100).fail(-> console.log arguments)

mapper = ->
  called = 0
  (item, index, array) ->
    delay 10 * (array.length - index), -> called++

async.map([1,1,1], mapper()).always(-> console.log "Sequential: %j", arguments)
async.parallel.map([1,1,1], mapper()).always(-> console.log "Parallel: %j", arguments)

detector = (item) ->
  delay 0, -> item % 42 == 0

async.some([1,5,7], detector).always(console.log)
async.some([1,5,42], detector).always(console.log)
async.detect([1,5,7], detector).always(console.log)
async.detect([1,5,84], detector).always(console.log)

getPosts()
  .done(-> console.log "Received posts.")
  .when((posts) -> posts[0].getAuthor())
  .done(-> console.log "Received author.")
  .when((author) -> author.name)
  .done((name) -> console.log "Name: %s", name)
  .timeout(500)
  .fail((e) -> console.log "Failed: %s.", e)
  .done(-> console.log "Success.")