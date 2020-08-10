const Liquid = require('..')

describe('Iterable', function () {
  describe('.cast', function () {
    it("doesn't cast iterables", function () {
      const iterable = new Liquid.Iterable()
      return expect(Liquid.Iterable.cast(iterable)).to.equal(iterable)
    })

    it('casts null/undefined to an empty iterable', () => {
      expect(Liquid.Iterable.cast(null).toArray()).to.deep.equal([])
    })
  })

  describe('.slice', () =>
    it('is abstract', () =>
      expect(() => new Liquid.Iterable().slice()).to.throw(/not implemented/)
    )
  )

  return describe('.last', () =>
    it('is abstract', () =>
      expect(() => new Liquid.Iterable().last()).to.throw(/not implemented/)
    )
  )
})
