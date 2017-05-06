import Promise from 'any-promise'
import strftime from 'strftime'
import { Liquid, expect } from './_helpers'

const hasProp = Object.prototype.hasOwnProperty

describe('StandardFilters', () => {
  let filter
  let filterName
  let ref
  beforeEach(function () {
    this.filters = Liquid.StandardFilters
  })
  describe('taking string inputs', () => it('handles odd objects', function () {
    const noop = () => {}
    expect(this.filters.upcase({
      toString () {
        noop()
      }
    })).to.equal('FUNCTION () {}')
    expect(this.filters.upcase({
      toString: null
    })).to.equal('[OBJECT OBJECT]')
  }))
  describe('taking array inputs', () => it('handles non-arrays', function () {
    expect(this.filters.sort(1)).to.become([1])
  }))
  ref = Liquid.StandardFilters
  for (filterName in ref) {
    if (!hasProp.call(ref, filterName)) continue
    filter = ref[filterName]
    describe(filterName, () => [null, void 0, true, false, 1, 'string', [], {}].forEach(param => {
      const paramString = JSON.stringify(param)
      it(`handles \`${paramString}\` as input`, () => expect(() => filter(param)).not.to.throw())
    }))
  }
  describe('size', () => {
    it("returns 0 for ''", function () {
      expect(this.filters.size('')).to.equal(0)
    })
    it("returns 3 for 'abc'", function () {
      expect(this.filters.size('abc')).to.equal(3)
    })
    it('returns 0 for empty arrays', function () {
      expect(this.filters.size([])).to.equal(0)
    })
    it('returns 3 for [1,2,3]', function () {
      expect(this.filters.size([1, 2, 3])).to.equal(3)
    })
    it('returns 0 for numbers', function () {
      expect(this.filters.size(1)).to.equal(0)
    })
    it('returns 0 for true', function () {
      expect(this.filters.size(true)).to.equal(0)
    })
    it('returns 0 for false', function () {
      expect(this.filters.size(false)).to.equal(0)
    })
    it('returns 0 for null', function () {
      expect(this.filters.size(null)).to.equal(0)
    })
  })
  describe('downcase', () => {
    it('downcases strings', function () {
      expect(this.filters.downcase('HiThere')).to.equal('hithere')
    })
    it('uses toString', function () {
      let o
      o = {
        toString: function () {
          'aString'
        }
      }
      expect(this.filters.downcase(o)).to.equal('astring')
    })
  })
  describe('upcase', () => {
    it('upcases strings', function () {
      expect(this.filters.upcase('HiThere')).to.equal('HITHERE')
    })
    it('uses toString', function () {
      let o
      o = {
        toString: function () {
          'aString'
        }
      }
      expect(this.filters.upcase(o)).to.equal('ASTRING')
    })
  })
  describe('join', () => it('joins arrays', function () {
    Promise.all([expect(this.filters.join([1, 2])).to.become('1 2'), expect(this.filters.join([1, 2], '-')).to.become('1-2'), expect(this.filters.join([])).to.become(''), expect(this.filters.join(new Liquid.Range(1, 5))).to.become('1 2 3 4')])
  }))
  describe('split', () => it('splits strings', function () {
    expect(this.filters.split('1-2-3', '-')).to.deep.equal(['1', '2', '3'])
    expect(this.filters.split('', '-')).to.not.exist()
  }))
  describe('append', () => it('appends strings', function () {
    expect(this.filters.append('Hi', 'There')).to.equal('HiThere')
  }))
  describe('prepend', () => it('prepends strings', function () {
    expect(this.filters.prepend('There', 'Hi')).to.equal('HiThere')
  }))
  describe('capitalize', () => it('capitalizes words in the input sentence', function () {
    expect(this.filters.capitalize('hi there.')).to.equal('Hi there.')
  }))
  describe('sort', () => {
    it('sorts elements in array', function () {
      expect(this.filters.sort([1, 3, 2])).to.become([1, 2, 3])
    })
    it('sorts non-primitive elements in array via property', function () {
      expect(this.filters.sort([
        {
          name: 'sirlantis'
        }, {
          name: 'shopify'
        }, {
          name: 'dotnil'
        }
      ], 'name')).to.become([
        {
          name: 'dotnil'
        }, {
          name: 'shopify'
        }, {
          name: 'sirlantis'
        }
      ])
    })
    it('sorts on future properties', function () {
      let input
      input = [
        {
          count: Promise.resolve(5)
        }, {
          count: Promise.resolve(3)
        }, {
          count: Promise.resolve(7)
        }
      ]
      expect(this.filters.sort(input, 'count')).to.become([input[1], input[0], input[2]])
    })
  })
  describe('map', () => {
    it('maps array without property', function () {
      expect(this.filters.map([1, 2, 3])).to.deep.equal([1, 2, 3])
    })
    it('maps array with property', function () {
      expect(this.filters.map([
        {
          name: 'sirlantis'
        }, {
          name: 'shopify'
        }, {
          name: 'dotnil'
        }
      ], 'name')).to.become(['sirlantis', 'shopify', 'dotnil'])
    })
  })
  describe('escape', () => it('escapes strings', function () {
    expect(this.filters.escape('<strong>')).to.equal('&lt;strong&gt;')
  }))
  describe('escape_once', () => it('returns an escaped version of html without affecting existing escaped entities', function () {
    expect(this.filters.escape_once('&lt;strong&gt;Hulk</strong>')).to.equal('&lt;strong&gt;Hulk&lt;/strong&gt;')
  }))
  describe('strip_html', () => it('strip html from string', function () {
    expect(this.filters.strip_html('<div>test</div>')).to.equal('test')
    expect(this.filters.strip_html("<div id='test'>test</div>")).to.equal('test')
    expect(this.filters.strip_html("<script type='text/javascript'>document.write('some stuff');</script>")).to.equal('')
    expect(this.filters.strip_html("<style type='text/css'>foo bar</style>")).to.equal('')
    expect(this.filters.strip_html("<div\nclass='multiline'>test</div>")).to.equal('test')
  }))
  describe('strip_newlines', () => it('strip all newlines (\n) from string', function () {
    expect(this.filters.strip_newlines('a\nb\nc')).to.equal('abc')
    expect(this.filters.strip_newlines('a\r\nb\nc')).to.equal('abc')
  }))
  describe('newline_to_br', () => it('replace each newline (\n) with html break', function () {
    expect(this.filters.newline_to_br('a\nb\nc')).to.equal('a<br />\nb<br />\nc')
  }))
  describe('replace', () => it('replace each occurrence', function () {
    expect(this.filters.replace('1 1 1 1', '1', '2')).to.equal('2 2 2 2')
  }))
  describe('replace_first', () => it('replace the first occurrence', function () {
    expect(this.filters.replace_first('1 1 1 1', '1', '2')).to.equal('2 1 1 1')
  }))
  describe('remove', () => it('remove each occurrence', function () {
    expect(this.filters.remove('a a a a', 'a')).to.equal('   ')
  }))
  describe('remove_first', () => it('remove the first occurrence', function () {
    expect(this.filters.remove_first('a a a a', 'a')).to.equal(' a a a')
  }))
  describe('date', () => {
    let parseDate
    parseDate = s => new Date(Date.parse(s))
    it('formats dates', function () {
      expect(this.filters.date(parseDate('2006-05-05 10:00:00'), '%B')).to.equal('May')
      expect(this.filters.date(parseDate('2006-06-05 10:00:00'), '%B')).to.equal('June')
      expect(this.filters.date(parseDate('2006-07-05 10:00:00'), '%B')).to.equal('July')
    })
    it('formats date strings', function () {
      expect(this.filters.date('2006-05-05 10:00:00', '%B')).to.equal('May')
      expect(this.filters.date('2006-06-05 10:00:00', '%B')).to.equal('June')
      expect(this.filters.date('2006-07-05 10:00:00', '%B')).to.equal('July')
    })
    it('formats without format', function () {
      expect(this.filters.date('2006-05-05 08:00:00 GMT')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(this.filters.date('2006-05-05 08:00:00 GMT', void 0)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(this.filters.date('2006-05-05 08:00:00 GMT', null)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(this.filters.date('2006-05-05 08:00:00 GMT', '')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
    })
    it('formats with format', function () {
      expect(this.filters.date('2006-07-05 10:00:00', '%m/%d/%Y')).to.equal('07/05/2006')
      expect(this.filters.date('Fri Jul 16 01:00:00 2004', '%m/%d/%Y')).to.equal('07/16/2004')
    })
    it('formats the date when passing in now', function () {
      expect(this.filters.date('now', '%m/%d/%Y')).to.equal(strftime('%m/%d/%Y'))
    })
    it('ignores non-dates', function () {
      expect(this.filters.date(null, '%B')).to.equal('')
      expect(this.filters.date(void 0, '%B')).to.equal('')
    })
    it('formats numbers', function () {
      expect(this.filters.date(1152098955000, '%m/%d/%Y')).to.equal('07/05/2006')
      expect(this.filters.date('1152098955000', '%m/%d/%Y')).to.equal('07/05/2006')
    })
  })
  describe('truncate', () => it('truncates', function () {
    expect(this.filters.truncate('Lorem ipsum', 5)).to.equal('Lo...')
    expect(this.filters.truncate('Lorem ipsum', 5, '..')).to.equal('Lor..')
    expect(this.filters.truncate('Lorem ipsum', 0, '..')).to.equal('..')
    expect(this.filters.truncate('Lorem ipsum')).to.equal('Lorem ipsum')
    expect(this.filters.truncate('Lorem ipsum dolor sit amet, consetetur sadipscing elitr.')).to.equal('Lorem ipsum dolor sit amet, consetetur sadipsci...')
  }))
  describe('truncatewords', () => it('truncates', function () {
    expect(this.filters.truncatewords('Lorem ipsum dolor sit', 2)).to.equal('Lorem ipsum...')
    expect(this.filters.truncatewords('Lorem ipsum dolor sit', 2, '..')).to.equal('Lorem ipsum..')
    expect(this.filters.truncatewords('Lorem ipsum dolor sit', -2)).to.equal('Lorem...')
    expect(this.filters.truncatewords('', 1)).to.equal('')
    expect(this.filters.truncatewords('A B C D E F G H I J K L M N O P Q')).to.equal('A B C D E F G H I J K L M N O...')
  }))
  describe('minus', () => it('subtracts', function () {
    expect(this.filters.minus(2, 1)).to.equal(1)
  }))
  describe('plus', () => it('adds', function () {
    expect(this.filters.plus(2, 1)).to.equal(3)
  }))
  describe('times', () => it('multiplies', function () {
    expect(this.filters.times(2, 3)).to.equal(6)
  }))
  describe('dividedBy', () => it('divides', function () {
    expect(this.filters.dividedBy(8, 2)).to.equal(4)
    expect(this.filters.divided_by(8, 2)).to.equal(4)
  }))
  describe('round', () => it('rounds', function () {
    expect(this.filters.round(3.1415, 2)).to.equal('3.14')
    expect(this.filters.round(3.9999, 2)).to.equal('4.00')
  }))
  describe('modulo', () => it('applies modulo', function () {
    expect(this.filters.modulo(7, 3)).to.equal(1)
  }))
  describe('last', () => it('returns last element', function () {
    Promise.all([expect(this.filters.last([1, 2, 3])).to.become(3), expect(this.filters.last('abc')).to.become('c'), expect(this.filters.last(1)).to.become(1), expect(this.filters.last([])).to.eventually.not.exist, expect(this.filters.last(new Liquid.Range(0, 1000))).to.become(999)])
  }))
  describe('first', () => it('returns first element', function () {
    Promise.all([expect(this.filters.first([1, 2, 3])).to.become(1), expect(this.filters.first('abc')).to.become('a'), expect(this.filters.first(1)).to.become(1), expect(this.filters.first([])).to.eventually.not.exist, expect(this.filters.first(new Liquid.Range(0, 1000))).to.become(0)])
  }))
  describe('default', () => {
    it('uses the empty string as the default defaultValue', function () {
      expect(this.filters['default'](void 0)).to.equal('')
    })
    it('allows using undefined values as defaultValue', function () {
      expect(this.filters['default'](void 0, void 0)).to.equal(void 0)
    })
    it('uses input for non-empty string', function () {
      expect(this.filters['default']('foo', 'bar')).to.equal('foo')
    })
    it('uses default for undefined', function () {
      expect(this.filters['default'](void 0, 'bar')).to.equal('bar')
    })
    it('uses default for null', function () {
      expect(this.filters['default'](null, 'bar')).to.equal('bar')
    })
    it('uses default for false', function () {
      expect(this.filters['default'](false, 'bar')).to.equal('bar')
    })
    it('uses default for blank string', function () {
      expect(this.filters['default']('', 'bar')).to.equal('bar')
    })
    it('uses default for empty array', function () {
      expect(this.filters['default']([], 'bar')).to.equal('bar')
    })
    it('uses default for empty object', function () {
      expect(this.filters['default']({}, 'bar')).to.equal('bar')
    })
    it('uses input for number', function () {
      expect(this.filters['default'](123, 'bar')).to.equal(123)
    })
    it('uses input for 0', function () {
      expect(this.filters['default'](0, 'bar')).to.equal(0)
    })
  })
})
