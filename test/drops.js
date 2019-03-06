const Liquid = require('..')

describe('Drop', function () {
  beforeEach(function () {
    const Cls = (this.Droplet = class Droplet extends Liquid.Drop {
      static initClass () {
        this.prototype.a = 1
      }
      b () { return 2 }
    })
    Cls.initClass()

    this.drop = new this.Droplet()
  })

  it('is an instanceof Drop', function () {
    expect(this.drop).to.be.instanceof(this.Droplet)
    return expect(this.drop).to.be.instanceof(Liquid.Drop)
  })

  it('protects regular objects', function () {
    const notDrop = { a: 1, b () { return 'foo' } }
    return renderTest('1', '{{ drop.a }}{{ drop.b }}', { drop: notDrop })
  })

  // xit('can be rendered', function () {
  //   return renderTest('12', '{{ drop.a }}{{ drop.b }}', { drop: this.drop })
  // })

  // xit('checks if methods are invokable', function () {
  //   expect(this.Droplet.isInvokable('a')).to.be.ok
  //   expect(this.Droplet.isInvokable('b')).to.be.ok
  //   expect(this.Droplet.isInvokable('toLiquid')).to.be.ok

  //   expect(this.Droplet.isInvokable('c')).to.be.not.ok
  //   expect(this.Droplet.isInvokable('invokeDrop')).to.be.not.ok
  //   expect(this.Droplet.isInvokable('beforeMethod')).to.be.not.ok
  //   return expect(this.Droplet.isInvokable('hasKey')).to.be.not.ok
  // })

  it('renders', function () {
    return renderTest('[Liquid.Drop Droplet]', '{{ drop }}', { drop: this.drop })
  })

  return it('allows method-hooks', function () {
    this.drop.beforeMethod = function (m) {
      if (m === 'c') {
        return 1
      } else {
        return 2
      }
    }

    return renderTest('12', '{{ drop.c }}{{ drop.d }}', { drop: this.drop })
  })
})
