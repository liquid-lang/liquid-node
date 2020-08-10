const Liquid = require('..')
const strftime = require('strftime')

describe('StandardFilters', function () {
  beforeEach(function () {
    this.filters = Liquid.StandardFilters
  })

  describe('taking string inputs', () =>
    it('handles odd objects', function () {
      const noop = function () {}
      expect(this.filters.upcase({ toString () { return noop } })).to.equal('FUNCTION () {}')
      return expect(this.filters.upcase({ toString: null })).to.equal('[OBJECT OBJECT]')
    })
  )

  describe('taking array inputs', () =>
    it('handles non-arrays', function () {
      return expect(this.filters.sort(1)).to.become([1])
    })
  )

  for (let filterName of Object.keys(Liquid.StandardFilters || {})) {
    var filter = Liquid.StandardFilters[filterName]
    describe(filterName, () =>
      [null, undefined, true, false, 1, 'string', [], {}].forEach(function (param) {
        const paramString = JSON.stringify(param)
        return it(`handles \`${paramString}\` as input`, () =>
          expect(() => filter(param)).not.to.throw()
        )
      })
    )
  }

  describe('size', function () {
    it("returns 0 for ''", function () {
      return expect(this.filters.size('')).to.equal(0)
    })

    it("returns 3 for 'abc'", function () {
      return expect(this.filters.size('abc')).to.equal(3)
    })

    it('returns 0 for empty arrays', function () {
      return expect(this.filters.size([])).to.equal(0)
    })

    it('returns 3 for [1,2,3]', function () {
      return expect(this.filters.size([1, 2, 3])).to.equal(3)
    })

    it('returns 0 for numbers', function () {
      return expect(this.filters.size(1)).to.equal(0)
    })

    it('returns 0 for true', function () {
      return expect(this.filters.size(true)).to.equal(0)
    })

    it('returns 0 for false', function () {
      return expect(this.filters.size(false)).to.equal(0)
    })

    return it('returns 0 for null', function () {
      return expect(this.filters.size(null)).to.equal(0)
    })
  })

  describe('downcase', function () {
    it('downcases strings', function () {
      return expect(this.filters.downcase('HiThere')).to.equal('hithere')
    })

    return it('uses toString', function () {
      const o = { toString () { return 'aString' } }
      return expect(this.filters.downcase(o)).to.equal('astring')
    })
  })

  describe('upcase', function () {
    it('upcases strings', function () {
      return expect(this.filters.upcase('HiThere')).to.equal('HITHERE')
    })

    return it('uses toString', function () {
      const o = { toString () { return 'aString' } }
      return expect(this.filters.upcase(o)).to.equal('ASTRING')
    })
  })

  describe('join', () =>
    it('joins arrays', function () {
      return Promise.all([
        expect(this.filters.join([1, 2])).to.equal('1 2'),
        expect(this.filters.join([1, 2], '-')).to.equal('1-2'),
        expect(this.filters.join([])).to.equal(''),
        expect(this.filters.join(new Liquid.Range(1, 5))).to.equal('1 2 3 4')
      ])
    })
  )

  describe('split', () =>
    it('splits strings', function () {
      expect(this.filters.split('1-2-3', '-')).to.deep.equal(['1', '2', '3'])
      return expect(this.filters.split('', '-')).to.not.exist
    })
  )

  describe('append', () =>
    it('appends strings', function () {
      return expect(this.filters.append('Hi', 'There')).to.equal('HiThere')
    })
  )

  describe('prepend', () =>
    it('prepends strings', function () {
      return expect(this.filters.prepend('There', 'Hi')).to.equal('HiThere')
    })
  )

  describe('capitalize', () =>
    it('capitalizes words in the input sentence', function () {
      return expect(this.filters.capitalize('hi there.')).to.equal('Hi there.')
    })
  )

  describe('sort', function () {
    it('sorts elements in array', function () {
      return expect(this.filters.sort([1, 3, 2])).to.become([1, 2, 3])
    })

    // skip this test because it's flaky
    it.skip('sorts non-primitive elements in array via property', function () {
      return expect(this.filters.sort([
        { name: 'sirlantis' },
        { name: 'shopify' },
        { name: 'dotnil' }
      ], 'name')).to.become([
        { name: 'dotnil' },
        { name: 'shopify' },
        { name: 'sirlantis' }
      ])
    })

    return it('sorts on future properties', function () {
      const input = [
        { count: Promise.resolve(5) },
        { count: Promise.resolve(3) },
        { count: Promise.resolve(7) }
      ]

      return expect(this.filters.sort(input, 'count')).to.become([
        input[1],
        input[0],
        input[2]
      ])
    })
  })

  describe('map', function () {
    it('maps array without property', function () {
      return expect(this.filters.map([1, 2, 3])).to.deep.equal([1, 2, 3])
    })

    return it('maps array with property', function () {
      return expect(this.filters.map([
        { name: 'sirlantis' },
        { name: 'shopify' },
        { name: 'dotnil' }
      ], 'name')).to.become([ 'sirlantis', 'shopify', 'dotnil' ])
    })
  })

  describe('escape', () =>
    it('escapes strings', function () {
      return expect(this.filters.escape('<strong>')).to.equal('&lt;strong&gt;')
    })
  )

  describe('escape_once', () =>
    it('returns an escaped version of html without affecting existing escaped entities', function () {
      return expect(this.filters.escape_once('&lt;strong&gt;Hulk</strong>'))
        .to.equal('&lt;strong&gt;Hulk&lt;/strong&gt;')
    })
  )

  describe('strip_html', () =>
    it('strip html from string', function () {
      expect(this.filters.strip_html('<div>test</div>')).to.equal('test')
      expect(this.filters.strip_html("<div id='test'>test</div>")).to.equal('test')

      expect(this.filters.strip_html(
        "<script type='text/javascript'>document.write('some stuff');</script>"
      )).to.equal('')

      expect(this.filters.strip_html(
        "<style type='text/css'>foo bar</style>"
      )).to.equal('')

      return expect(this.filters.strip_html(
        "<div\nclass='multiline'>test</div>"
      )).to.equal('test')
    })
  )

  describe('strip_newlines', () =>
    it('strip all newlines (\n) from string', function () {
      expect(this.filters.strip_newlines('a\nb\nc')).to.equal('abc')
      return expect(this.filters.strip_newlines('a\r\nb\nc')).to.equal('abc')
    })
  )

  describe('newline_to_br', () =>
    it('replace each newline (\n) with html break', function () {
      return expect(this.filters.newline_to_br('a\nb\nc')).to.equal('a<br />\nb<br />\nc')
    })
  )

  describe('replace', () =>
    it('replace each occurrence', function () {
      return expect(this.filters.replace('1 1 1 1', '1', '2')).to.equal('2 2 2 2')
    })
  )

  describe('replace_first', () =>
    it('replace the first occurrence', function () {
      return expect(this.filters.replace_first('1 1 1 1', '1', '2')).to.equal('2 1 1 1')
    })
  )

  describe('remove', () =>
    it('remove each occurrence', function () {
      return expect(this.filters.remove('a a a a', 'a')).to.equal('   ')
    })
  )

  describe('remove_first', () =>
    it('remove the first occurrence', function () {
      return expect(this.filters.remove_first('a a a a', 'a')).to.equal(' a a a')
    })
  )

  describe('date', function () {
    const parseDate = s => new Date(Date.parse(s))

    it('formats dates', function () {
      expect(this.filters.date(parseDate('2006-05-05 10:00:00'), '%B')).to.equal('May')
      expect(this.filters.date(parseDate('2006-06-05 10:00:00'), '%B')).to.equal('June')
      return expect(this.filters.date(parseDate('2006-07-05 10:00:00'), '%B')).to.equal('July')
    })

    it('formats date strings', function () {
      expect(this.filters.date('2006-05-05 10:00:00', '%B')).to.equal('May')
      expect(this.filters.date('2006-06-05 10:00:00', '%B')).to.equal('June')
      return expect(this.filters.date('2006-07-05 10:00:00', '%B')).to.equal('July')
    })

    it('formats without format', function () {
      expect(this.filters.date('2006-05-05 08:00:00 GMT')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(this.filters.date('2006-05-05 08:00:00 GMT', undefined)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(this.filters.date('2006-05-05 08:00:00 GMT', null)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      return expect(this.filters.date('2006-05-05 08:00:00 GMT', '')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
    })

    it('formats with format', function () {
      expect(this.filters.date('2006-07-05 10:00:00', '%m/%d/%Y')).to.equal('07/05/2006')
      return expect(this.filters.date('Fri Jul 16 01:00:00 2004', '%m/%d/%Y')).to.equal('07/16/2004')
    })

    it('formats the date when passing in now', function () {
      return expect(this.filters.date('now', '%m/%d/%Y')).to.equal(strftime('%m/%d/%Y'))
    })

    it('ignores non-dates', function () {
      expect(this.filters.date(null, '%B')).to.equal('')
      return expect(this.filters.date(undefined, '%B')).to.equal('')
    })

    // This differs from the original Ruby implementation since JavaScript
    // uses epoch milliseconds and not epoch seconds.
    return it('formats numbers', function () {
      expect(this.filters.date(1152098955000, '%m/%d/%Y')).to.equal('07/05/2006')
      return expect(this.filters.date('1152098955000', '%m/%d/%Y')).to.equal('07/05/2006')
    })
  })

  describe('truncate', () =>
    it('truncates', function () {
      expect(this.filters.truncate('Lorem ipsum', 5)).to.equal('Lo...')
      expect(this.filters.truncate('Lorem ipsum', 5, '..')).to.equal('Lor..')
      expect(this.filters.truncate('Lorem ipsum', 0, '..')).to.equal('..')
      expect(this.filters.truncate('Lorem ipsum')).to.equal('Lorem ipsum')
      return expect(this.filters.truncate('Lorem ipsum dolor sit amet, consetetur sadipscing elitr.')).to.equal('Lorem ipsum dolor sit amet, consetetur sadipsci...')
    })
  )

  describe('truncatewords', () =>
    it('truncates', function () {
      expect(this.filters.truncatewords('Lorem ipsum dolor sit', 2)).to.equal('Lorem ipsum...')
      expect(this.filters.truncatewords('Lorem ipsum dolor sit', 2, '..')).to.equal('Lorem ipsum..')
      expect(this.filters.truncatewords('Lorem ipsum dolor sit', -2)).to.equal('Lorem...')
      expect(this.filters.truncatewords('', 1)).to.equal('')

      // default: 15 words
      return expect(this.filters.truncatewords('A B C D E F G H I J K L M N O P Q')).to.equal('A B C D E F G H I J K L M N O...')
    })
  )

  describe('minus', () =>
    it('subtracts', function () {
      return expect(this.filters.minus(2, 1)).to.equal(1)
    })
  )

  describe('plus', () =>
    it('adds', function () {
      return expect(this.filters.plus(2, 1)).to.equal(3)
    })
  )

  describe('times', () =>
    it('multiplies', function () {
      return expect(this.filters.times(2, 3)).to.equal(6)
    })
  )

  describe('dividedBy', () =>
    it('divides', function () {
      expect(this.filters.dividedBy(8, 2)).to.equal(4)
      return expect(this.filters.divided_by(8, 2)).to.equal(4)
    })
  )

  describe('round', () =>
    it('rounds', function () {
      expect(this.filters.round(3.1415, 2)).to.equal('3.14')
      return expect(this.filters.round(3.9999, 2)).to.equal('4.00')
    })
  )

  describe('modulo', () =>
    it('applies modulo', function () {
      return expect(this.filters.modulo(7, 3)).to.equal(1)
    })
  )

  describe('last', () =>
    it('returns last element', function () {
      return Promise.all([
        expect(this.filters.last([1, 2, 3])).to.equal(3),
        expect(this.filters.last('abc')).to.equal('c'),
        expect(this.filters.last(1)).to.equal(1),
        expect(this.filters.last([])).to.be.undefined,
        expect(this.filters.last(new Liquid.Range(0, 1000))).to.equal(999)
      ])
    })
  )

  describe('first', () =>
    it('returns first element', function () {
      return Promise.all([
        expect(this.filters.first([1, 2, 3])).to.equal(1),
        expect(this.filters.first('abc')).to.equal('a'),
        expect(this.filters.first(1)).to.equal(1),
        expect(this.filters.first([])).to.be.undefined,
        expect(this.filters.first(new Liquid.Range(0, 1000))).to.equal(0)
      ])
    })
  )

  return describe('default', function () {
    it('uses the empty string as the default defaultValue', function () {
      return expect(this.filters.default(undefined)).to.equal('')
    })

    it('allows using undefined values as defaultValue', function () {
      return expect(this.filters.default(undefined, undefined)).to.equal(undefined)
    })

    it('uses input for non-empty string', function () {
      return expect(this.filters.default('foo', 'bar')).to.equal('foo')
    })

    it('uses default for undefined', function () {
      return expect(this.filters.default(undefined, 'bar')).to.equal('bar')
    })

    it('uses default for null', function () {
      return expect(this.filters.default(null, 'bar')).to.equal('bar')
    })

    it('uses default for false', function () {
      return expect(this.filters.default(false, 'bar')).to.equal('bar')
    })

    it('uses default for blank string', function () {
      return expect(this.filters.default('', 'bar')).to.equal('bar')
    })

    it('uses default for empty array', function () {
      return expect(this.filters.default([], 'bar')).to.equal('bar')
    })

    it('uses default for empty object', function () {
      return expect(this.filters.default({}, 'bar')).to.equal('bar')
    })

    it('uses input for number', function () {
      return expect(this.filters.default(123, 'bar')).to.equal(123)
    })

    return it('uses input for 0', function () {
      return expect(this.filters.default(0, 'bar')).to.equal(0)
    })
  })
})
