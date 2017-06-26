Liquid = requireLiquid()
Promise = require "any-promise"

asyncResult = (result, delay = 1) ->
  new Promise (resolve) ->
    onTimeout = -> resolve(result)
    setTimeout onTimeout, delay

describe "Futures", ->
  it "are supported as simple variables", ->
    renderTest 'worked', '{{ test }}', test: asyncResult("worked")

  it "are supported as complex variables", ->
    renderTest 'worked', '{{ test.text }}', test: asyncResult(text: "worked")

  it "are supported as filter input", ->
    renderTest 'WORKED', '{{ test | upcase }}', test: asyncResult("worked")

  it "are supported as filter arguments", ->
    renderTest '1-2-3', '{{ array | join:minus }}',
      minus: asyncResult("-")
      array: [1, 2, 3]

  it "are supported as filter arguments", ->
    renderTest '1+2+3', '{{ array | join:minus | split:minus | join:plus }}',
      minus: asyncResult("-")
      plus: asyncResult("+")
      array: [1, 2, 3]

  it "are supported in conditions", ->
    renderTest 'YES', '{% if test %}YES{% else %}NO{% endif %}',
      test: asyncResult(true)

  it "are supported in captures", ->
    renderTest 'Monkeys&Monkeys', '{% capture heading %}{{animal}}{% endcapture %}{{heading}}&{{heading}}',
      animal: asyncResult("Monkeys")

  it "are supported in assigns", ->
    renderTest 'YES', '{% assign test = var %}{% if test == 42 %}YES{% else %}NO{% endif %}',
      var: asyncResult(42)

  context "in for-loops", ->
    it "are supported as lists", ->
      products = ({ id: "item#{i}" } for i in [1, 2, 2])
      doc = "{% for product in products %}- {{ product.id }}\n{% endfor %}"
      renderTest "- item1\n- item2\n- item2\n", doc,
        products: asyncResult(products)

    it "are supported as lists (with ifchanged)", ->
      products = ({ id: "item#{i}" } for i in [1, 2, 2])
      doc = "{% for product in products %}{% ifchanged %}- {{ product.id }}\n{% endifchanged %}{% endfor %}"
      renderTest "- item1\n- item2\n", doc,
        products: asyncResult(products)

    it "are supported as elements", ->
      doc = "{% for product in products %}- {{ product.id }}\n{% endfor %}"
      products = ({ id: asyncResult("item#{i}") } for i in [1..3])

      renderTest "- item1\n- item2\n- item3\n", doc,
        products: products
