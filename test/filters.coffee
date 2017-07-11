Liquid = requireLiquid()
strftime = require "strftime"

describe "StandardFilters", ->
  beforeEach ->
    @filters = Liquid.StandardFilters

  describe "taking string inputs", ->
    it "handles odd objects", ->
      noop = ->
      expect(@filters.upcase(toString: -> noop)).to.equal "FUNCTION () {}"
      expect(@filters.upcase(toString: null)).to.equal "[OBJECT OBJECT]"

  describe "taking array inputs", ->
    it "handles non-arrays", ->
      expect(@filters.sort(1)).to.become [1]

  for own filterName, filter of Liquid.StandardFilters
    describe filterName, ->
      [null, undefined, true, false, 1, "string", [], {}].forEach (param) ->
        paramString = JSON.stringify param
        it "handles `#{paramString}` as input", ->
          expect ->
            filter(param)
          .not.to.throw()

  describe "size", ->
    it "returns 0 for ''", ->
      expect(@filters.size("")).to.equal 0

    it "returns 3 for 'abc'", ->
      expect(@filters.size("abc")).to.equal 3

    it "returns 0 for empty arrays", ->
      expect(@filters.size([])).to.equal 0

    it "returns 3 for [1,2,3]", ->
      expect(@filters.size([1,2,3])).to.equal 3

    it "returns 0 for numbers", ->
      expect(@filters.size(1)).to.equal 0

    it "returns 0 for true", ->
      expect(@filters.size(true)).to.equal 0

    it "returns 0 for false", ->
      expect(@filters.size(false)).to.equal 0

    it "returns 0 for null", ->
      expect(@filters.size(null)).to.equal 0

  describe "downcase", ->
    it "downcases strings", ->
      expect(@filters.downcase("HiThere")).to.equal "hithere"

    it "uses toString", ->
      o = toString: -> "aString"
      expect(@filters.downcase(o)).to.equal "astring"

  describe "upcase", ->
    it "upcases strings", ->
      expect(@filters.upcase("HiThere")).to.equal "HITHERE"

    it "uses toString", ->
      o = toString: -> "aString"
      expect(@filters.upcase(o)).to.equal "ASTRING"

  describe "join", ->
    it "joins arrays", ->
      Promise.all [
        expect(@filters.join([1, 2])).to.become "1 2"
        expect(@filters.join([1, 2], "-")).to.become "1-2"
        expect(@filters.join([])).to.become ""
        expect(@filters.join(new Liquid.Range(1, 5))).to.become "1 2 3 4"
      ]

  describe "split", ->
    it "splits strings", ->
      expect(@filters.split("1-2-3", "-")).to.deep.equal ["1", "2", "3"]
      expect(@filters.split("", "-")).to.not.exist

  describe "append", ->
    it "appends strings", ->
      expect(@filters.append("Hi", "There")).to.equal "HiThere"

  describe "prepend", ->
    it "prepends strings", ->
      expect(@filters.prepend("There", "Hi")).to.equal "HiThere"

  describe "capitalize", ->
    it "capitalizes words in the input sentence", ->
      expect(@filters.capitalize("hi there.")).to.equal "Hi there."

  describe "sort", ->
    it "sorts elements in array", ->
      expect(@filters.sort([1, 3, 2])).to.become [1, 2, 3]

    it "sorts non-primitive elements in array via property", ->
      expect(@filters.sort([
        { name: "sirlantis" },
        { name: "shopify" },
        { name: "dotnil" }
      ], "name")).to.become([
        { name: "dotnil" },
        { name: "shopify" },
        { name: "sirlantis" }
      ])

    it "sorts on future properties", ->
      input = [
        { count: Promise.resolve(5) }
        { count: Promise.resolve(3) }
        { count: Promise.resolve(7) }
      ]

      expect(@filters.sort(input, "count")).to.become [
        input[1],
        input[0]
        input[2]
      ]

  describe "map", ->
    it "maps array without property", ->
      expect(@filters.map([1, 2, 3])).to.deep.equal [1, 2, 3]

    it "maps array with property", ->
      expect(@filters.map([
        { name: "sirlantis" },
        { name: "shopify" },
        { name: "dotnil" }
      ], "name")).to.become [ "sirlantis", "shopify", "dotnil" ]

  describe "escape", ->
    it "escapes strings", ->
      expect(@filters.escape("<strong>")).to.equal "&lt;strong&gt;"

  describe "escape_once", ->
    it "returns an escaped version of html without affecting existing escaped entities", ->
      expect(@filters.escape_once("&lt;strong&gt;Hulk</strong>"))
        .to.equal "&lt;strong&gt;Hulk&lt;/strong&gt;"

  describe "strip_html", ->
    it "strip html from string", ->
      expect(@filters.strip_html("<div>test</div>")).to.equal "test"
      expect(@filters.strip_html("<div id='test'>test</div>")).to.equal "test"

      expect(@filters.strip_html(
        "<script type='text/javascript'>document.write('some stuff');</script>"
      )).to.equal ""

      expect(@filters.strip_html(
        "<style type='text/css'>foo bar</style>"
      )).to.equal ""

      expect(@filters.strip_html(
        "<div\nclass='multiline'>test</div>"
      )).to.equal "test"

  describe "strip_newlines", ->
    it "strip all newlines (\n) from string", ->
      expect(@filters.strip_newlines("a\nb\nc")).to.equal "abc"
      expect(@filters.strip_newlines("a\r\nb\nc")).to.equal "abc"

  describe "newline_to_br", ->
    it "replace each newline (\n) with html break", ->
      expect(@filters.newline_to_br("a\nb\nc")).to.equal "a<br />\nb<br />\nc"

  describe "replace", ->
    it "replace each occurrence", ->
      expect(@filters.replace("1 1 1 1", "1", "2")).to.equal "2 2 2 2"

  describe "replace_first", ->
    it "replace the first occurrence", ->
      expect(@filters.replace_first("1 1 1 1", "1", "2")).to.equal "2 1 1 1"

  describe "remove", ->
    it "remove each occurrence", ->
      expect(@filters.remove("a a a a", "a")).to.equal "   "

  describe "remove_first", ->
    it "remove the first occurrence", ->
      expect(@filters.remove_first("a a a a", "a")).to.equal " a a a"

  describe "date", ->
    parseDate = (s) -> new Date(Date.parse(s))

    it "formats dates", ->
      expect(@filters.date(parseDate("2006-05-05 10:00:00"), "%B")).to.equal "May"
      expect(@filters.date(parseDate("2006-06-05 10:00:00"), "%B")).to.equal "June"
      expect(@filters.date(parseDate("2006-07-05 10:00:00"), "%B")).to.equal "July"

    it "formats date strings", ->
      expect(@filters.date("2006-05-05 10:00:00", "%B")).to.equal "May"
      expect(@filters.date("2006-06-05 10:00:00", "%B")).to.equal "June"
      expect(@filters.date("2006-07-05 10:00:00", "%B")).to.equal "July"

    it "formats without format", ->
      expect(@filters.date("2006-05-05 08:00:00 GMT")).to.equal "Fri, 05 May 2006 08:00:00 GMT"
      expect(@filters.date("2006-05-05 08:00:00 GMT", undefined)).to.equal "Fri, 05 May 2006 08:00:00 GMT"
      expect(@filters.date("2006-05-05 08:00:00 GMT", null)).to.equal "Fri, 05 May 2006 08:00:00 GMT"
      expect(@filters.date("2006-05-05 08:00:00 GMT", "")).to.equal "Fri, 05 May 2006 08:00:00 GMT"

    it "formats with format", ->
      expect(@filters.date("2006-07-05 10:00:00", "%m/%d/%Y")).to.equal "07/05/2006"
      expect(@filters.date("Fri Jul 16 01:00:00 2004", "%m/%d/%Y")).to.equal "07/16/2004"

    it "formats the date when passing in now", ->
      expect(@filters.date("now", "%m/%d/%Y")).to.equal strftime("%m/%d/%Y")

    it "ignores non-dates", ->
      expect(@filters.date(null, "%B")).to.equal ""
      expect(@filters.date(undefined, "%B")).to.equal ""

    # This differs from the original Ruby implementation since JavaScript
    # uses epoch milliseconds and not epoch seconds.
    it "formats numbers", ->
      expect(@filters.date(1152098955000, "%m/%d/%Y")).to.equal "07/05/2006"
      expect(@filters.date("1152098955000", "%m/%d/%Y")).to.equal "07/05/2006"

  describe "truncate", ->
    it "truncates", ->
      expect(@filters.truncate("Lorem ipsum", 5)).to.equal "Lo..."
      expect(@filters.truncate("Lorem ipsum", 5, "..")).to.equal "Lor.."
      expect(@filters.truncate("Lorem ipsum", 0, "..")).to.equal ".."
      expect(@filters.truncate("Lorem ipsum")).to.equal "Lorem ipsum"
      expect(@filters.truncate("Lorem ipsum dolor sit amet, consetetur sadipscing elitr.")).to.equal "Lorem ipsum dolor sit amet, consetetur sadipsci..."

  describe "truncatewords", ->
    it "truncates", ->
      expect(@filters.truncatewords("Lorem ipsum dolor sit", 2)).to.equal "Lorem ipsum..."
      expect(@filters.truncatewords("Lorem ipsum dolor sit", 2, "..")).to.equal "Lorem ipsum.."
      expect(@filters.truncatewords("Lorem ipsum dolor sit", -2)).to.equal "Lorem..."
      expect(@filters.truncatewords("", 1)).to.equal ""

      # default: 15 words
      expect(@filters.truncatewords("A B C D E F G H I J K L M N O P Q")).to.equal "A B C D E F G H I J K L M N O..."

  describe "minus", ->
    it "subtracts", ->
      expect(@filters.minus(2, 1)).to.equal 1

  describe "plus", ->
    it "adds", ->
      expect(@filters.plus(2, 1)).to.equal 3

  describe "times", ->
    it "multiplies", ->
      expect(@filters.times(2, 3)).to.equal 6

  describe "dividedBy", ->
    it "divides", ->
      expect(@filters.dividedBy(8, 2)).to.equal 4
      expect(@filters.divided_by(8, 2)).to.equal 4

  describe "round", ->
    it "rounds", ->
      expect(@filters.round(3.1415,2)).to.equal "3.14"
      expect(@filters.round(3.9999,2)).to.equal "4.00"

  describe "modulo", ->
    it "applies modulo", ->
      expect(@filters.modulo(7, 3)).to.equal 1

  describe "last", ->
    it "returns last element", ->
      Promise.all [
        expect(@filters.last([1,2,3])).to.become 3
        expect(@filters.last("abc")).to.become "c"
        expect(@filters.last(1)).to.become 1
        expect(@filters.last([])).to.eventually.not.exist
        expect(@filters.last(new Liquid.Range(0, 1000))).to.become 999
      ]

  describe "first", ->
    it "returns first element", ->
      Promise.all [
        expect(@filters.first([1,2,3])).to.become 1
        expect(@filters.first("abc")).to.become "a"
        expect(@filters.first(1)).to.become 1
        expect(@filters.first([])).to.eventually.not.exist
        expect(@filters.first(new Liquid.Range(0, 1000))).to.become 0
      ]

  describe "default", ->
    it "uses the empty string as the default defaultValue", ->
      expect(@filters.default(undefined)).to.equal ""

    it "allows using undefined values as defaultValue", ->
      expect(@filters.default(undefined, undefined)).to.equal undefined

    it "uses input for non-empty string", ->
      expect(@filters.default("foo", "bar")).to.equal "foo"

    it "uses default for undefined", ->
      expect(@filters.default(undefined, "bar")).to.equal "bar"

    it "uses default for null", ->
      expect(@filters.default(null, "bar")).to.equal "bar"

    it "uses default for false", ->
      expect(@filters.default(false, "bar")).to.equal "bar"

    it "uses default for blank string", ->
      expect(@filters.default('', "bar")).to.equal "bar"

    it "uses default for empty array", ->
      expect(@filters.default([], "bar")).to.equal "bar"

    it "uses default for empty object", ->
      expect(@filters.default({}, "bar")).to.equal "bar"

    it "uses input for number", ->
      expect(@filters.default(123, "bar")).to.equal 123

    it "uses input for 0", ->
      expect(@filters.default(0, "bar")).to.equal 0
