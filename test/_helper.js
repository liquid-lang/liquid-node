
import Promise from 'any-promise'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

import {Liquid} from '../src'

// const requireLiquid = () => require(`../${process.env.LIQUID_NODE_COVERAGE ? 'lib' : 'src'}/index`)
// const {Liquid} = requireLiquid()

chai.use(chaiAsPromised)
chai.use(sinonChai)
const expect = chai.expect

const stringify = v => {
  try {
    return JSON.stringify(v, null, 2)
  } catch (error) {
    return `Couldn't stringify: ${v}`
  }
}

const renderTest = (expected, templateString, assigns, rethrowErrors = true) => {
  const engine = new Liquid.Engine()
  const parser = engine.parse(templateString)
  const renderer = parser.then(template => {
    template.rethrowErrors = rethrowErrors
    return template.render(assigns)
  })
  const test = renderer.then(output => {
    expect(output).to.be.a('string')
    if (expected instanceof RegExp) {
      return expect(output).to.match(expected)
    }
    return expect(output).to.eq(expected)
  })
  return Promise.all([expect(parser).to.be.fulfilled, expect(renderer).to.be.fulfilled, test])
}

export {
  chai,
  expect,
  Liquid,
  renderTest,
  // requireLiquid,
  sinon,
  stringify
}
