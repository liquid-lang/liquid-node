Liquid = require "../../liquid"
PromiseReduce = require "../../promise_reduce"
Iterable = require "../iterable"

# "For" iterates over an array or collection.
# Several useful variables are available to you within the loop.
#
# == Basic usage:
#    {% for item in collection %}
#      {{ forloop.index }}: {{ item.name }}
#    {% endfor %}
#
# == Advanced usage:
#    {% for item in collection %}
#      <div {% if forloop.first %}class="first"{% endif %}>
#        Item {{ forloop.index }}: {{ item.name }}
#      </div>
#    {% else %}
#      There is nothing in the collection.
#    {% endfor %}
#
# You can also define a limit and offset much like SQL.  Remember
# that offset starts at 0 for the first item.
#
#    {% for item in collection limit:5 offset:10 %}
#      {{ item.name }}
#    {% end %}
#
#  To reverse the for loop simply use {% for item in collection reversed %}
#
# == Available variables:
#
# forloop.name:: 'item-collection'
# forloop.length:: Length of the loop
# forloop.index:: The current item's position in the collection;
#                 forloop.index starts at 1.
#                 This is helpful for non-programmers who start believe
#                 the first item in an array is 1, not 0.
# forloop.index0:: The current item's position in the collection
#                  where the first item is 0
# forloop.rindex:: Number of items remaining in the loop
#                  (length - index) where 1 is the last item.
# forloop.rindex0:: Number of items remaining in the loop
#                   where 0 is the last item.
# forloop.first:: Returns true if the item is the first item.
# forloop.last:: Returns true if the item is the last item.
#
module.exports = class For extends Liquid.Block
  SyntaxHelp = "Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]"
  Syntax = ///
      (\w+)\s+in\s+
      ((?:#{Liquid.QuotedFragment.source})+)
      \s*(reversed)?
    ///

  constructor: (template, tagName, markup) ->
    match = Syntax.exec(markup)

    if match
      @variableName = match[1]
      @collectionName = match[2]
      @registerName = "#{match[1]}=#{match[2]}"
      @reversed = match[3]
      @attributes = {}

      Liquid.Helpers.scan(markup, Liquid.TagAttributes).forEach (attr) =>
        @attributes[attr[0]] = attr[1]
    else
      throw new Liquid.SyntaxError(SyntaxHelp)

    @nodelist = @forBlock = []
    super

  unknownTag: (tag, markup) ->
    return super unless tag == "else"
    @nodelist = @elseBlock = []

  render: (context) ->
    context.registers.for or= {}

    Promise.resolve(context.get(@collectionName)).then (collection) =>
      if collection?.forEach
        # pass
      else if collection instanceof Object
        collection = ([k, v] for own k, v of collection)
      else
        return @renderElse(context)

      from = if @attributes.offset is "continue"
        Number(context.registers["for"][@registerName]) or 0
      else
        Number(@attributes.offset) or 0

      limit = @attributes.limit
      to    = if limit then Number(limit) + from else null

      @sliceCollection(collection, from, to).then (segment) =>
        return @renderElse(context) if segment.length == 0

        segment.reverse() if @reversed

        length = segment.length

        # Store our progress through the collection for the continue flag
        context.registers["for"][@registerName] = from + segment.length

        context.stack =>
          PromiseReduce(segment, (output, item, index) =>
            context.set @variableName, item
            context.set "forloop",
              name    : @registerName
              length  : length
              index   : index + 1
              index0  : index,
              rindex  : length - index
              rindex0 : length - index - 1
              first   : index == 0
              last    : index == length - 1

            Promise.resolve()
              .then () =>
                @renderAll(@forBlock, context)
              .then (rendered) ->
                output.push rendered
                output
              .catch (e) ->
                output.push context.handleError e
                output
          , [])

  sliceCollection: (collection, from, to) ->
    args = [from]
    args.push to if to?
    Iterable.cast(collection).slice args...

  renderElse: (context) ->
    if @elseBlock
      return @renderAll(@elseBlock, context)
    else
      ""
