let chai, expect

const Liquid = require('..')
global.chai = (chai = require('chai'))
chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

global.expect = (expect = chai.expect)

global.renderTest = function (expected, templateString, assigns, rethrowErrors) {
  if (rethrowErrors == null) { rethrowErrors = true }
  const engine = new Liquid.Engine()

  const parser = engine.parse(templateString)

  const renderer = parser.then(function (template) {
    template.rethrowErrors = rethrowErrors
    return template.render(assigns)
  })

  const test = renderer.then(function (output) {
    expect(output).to.be.a('string')

    if (expected instanceof RegExp) {
      return expect(output).to.match(expected)
    } else {
      return expect(output).to.eq(expected)
    }
  })

  return Promise.all([
    expect(parser).to.be.fulfilled,
    expect(renderer).to.be.fulfilled,
    test
  ])
}
