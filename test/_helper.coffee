global.requireLiquid = -> require("../#{if process.env.LIQUID_NODE_COVERAGE then "lib" else "src"}/index")
Liquid = requireLiquid()

global.chai = chai = require "chai"
chai.use require "chai-as-promised"

global.sinon = sinon = require "sinon"
chai.use require "sinon-chai"

global.expect = expect = chai.expect

# JSON.stringify fails for circular dependencies
stringify = (v) ->
  try
    JSON.stringify(v, null, 2)
  catch e
    "Couldn't stringify: #{v}"

global.renderTest = (expected, templateString, assigns, rethrowErrors = true) ->
  engine = new Liquid.Engine

  parser = engine.parse templateString

  renderer = parser.then (template) ->
    template.rethrowErrors = rethrowErrors
    template.render assigns

  test = renderer.then (output) ->
    expect(output).to.be.a "string"

    if expected instanceof RegExp
      expect(output).to.match expected
    else
      expect(output).to.eq expected

  Promise.all([
    expect(parser).to.be.fulfilled
    expect(renderer).to.be.fulfilled
    test
  ])


