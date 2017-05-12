import Promise from 'any-promise'
import strftime from 'strftime'
import { Liquid, expect } from './_helper'

describe('StandardFilters', () => {
  const self = this || {}
  before(function () {
    self.filters = Liquid.StandardFilters
  })
  describe('taking string inputs', () => it('handles odd objects', function () {
    const noop = () => {}
    expect(self.filters.upcase({
      toString () {
        return noop()
      }
    })).to.equal('FUNCTION () {}')
    expect(self.filters.upcase({
      toString: null
    })).to.equal('[OBJECT OBJECT]')
  }))
  describe('taking array inputs', () => it('handles non-arrays', function () {
    expect(self.filters.sort(1)).to.become([1])
  }))
  Array.from(Liquid.StandardFilters).forEach(function (filter) {
    describe(filter.name, () => [null, undefined, true, false, 1, 'string', [], {}].forEach(param => {
      const paramString = JSON.stringify(param)
      it(`handles \`${paramString}\` as input`, () => expect(() => filter(param)).not.to.throw())
    }))
  })
  describe('size', () => {
    it("returns 0 for ''", function () {
      expect(self.filters.size('')).to.equal(0)
    })
    it("returns 3 for 'abc'", function () {
      expect(typeof self.filters.size).to.equal('function')
      expect(self.filters.size('abc')).to.equal(3)
    })
    it('returns 0 for empty arrays', function () {
      expect(self.filters.size([])).to.equal(0)
    })
    it('returns 3 for [1,2,3]', function () {
      expect(self.filters.size([1, 2, 3])).to.equal(3)
    })
    it('returns 0 for numbers', function () {
      expect(self.filters.size(1)).to.equal(0)
    })
    it('returns 0 for true', function () {
      expect(self.filters.size(true)).to.equal(0)
    })
    it('returns 0 for false', function () {
      expect(self.filters.size(false)).to.equal(0)
    })
    it('returns 0 for null', function () {
      expect(self.filters.size(null)).to.equal(0)
    })
  })
  describe('downcase', () => {
    it('downcases strings', function () {
      expect(self.filters.downcase('HiThere')).to.equal('hithere')
    })
    it('uses toString', function () {
      const o = {
        toString () {
          return 'aString'
        }
      }
      expect(self.filters.downcase(o)).to.equal('astring')
    })
  })
  describe('upcase', () => {
    it('upcases strings', function () {
      expect(self.filters.upcase('HiThere')).to.equal('HITHERE')
    })
    it('uses toString', function () {
      const o = {
        toString () {
          return 'aString'
        }
      }
      expect(self.filters.upcase(o)).to.equal('ASTRING')
    })
  })
  describe('join', () => it('joins arrays', function () {
    Promise.all([expect(self.filters.join([1, 2])).to.become('1 2'), expect(self.filters.join([1, 2], '-')).to.become('1-2'), expect(self.filters.join([])).to.become(''), expect(self.filters.join(new Liquid.Range(1, 5))).to.become('1 2 3 4')])
  }))
  describe('split', () => it('splits strings', function () {
    expect(self.filters.split('1-2-3', '-')).to.deep.equal(['1', '2', '3'])
    return expect(self.filters.split('', '-')).to.not.exist
  }))
  describe('append', () => it('appends strings', function () {
    expect(self.filters.append('Hi', 'There')).to.equal('HiThere')
  }))
  describe('prepend', () => it('prepends strings', function () {
    expect(self.filters.prepend('There', 'Hi')).to.equal('HiThere')
  }))
  describe('capitalize', () => it('capitalizes words in the input sentence', function () {
    expect(self.filters.capitalize('hi there.')).to.equal('Hi there.')
  }))
  describe('sort', () => {
    it('sorts elements in array', function () {
      expect(self.filters.sort([1, 3, 2])).to.become([1, 2, 3])
    })
    it('sorts non-primitive elements in array via property', function () {
      expect(self.filters.sort([
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
      const input = [
        {
          count: Promise.resolve(5)
        }, {
          count: Promise.resolve(3)
        }, {
          count: Promise.resolve(7)
        }
      ]
      expect(self.filters.sort(input, 'count')).to.become([input[1], input[0], input[2]])
    })
  })
  describe('map', () => {
    it('maps array without property', function () {
      expect(self.filters.map([1, 2, 3])).to.deep.equal([1, 2, 3])
    })
    it('maps array with property', function () {
      expect(self.filters.map([
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
    expect(self.filters.escape('<strong>')).to.equal('&lt;strong&gt;')
  }))
  describe('escape_once', () => it('returns an escaped version of html without affecting existing escaped entities', function () {
    expect(self.filters.escape_once('&lt;strong&gt;Hulk</strong>')).to.equal('&lt;strong&gt;Hulk&lt;/strong&gt;')
  }))
  describe('strip_html', () => it('strip html from string', function () {
    expect(self.filters.strip_html('<div>test</div>')).to.equal('test')
    expect(self.filters.strip_html("<div id='test'>test</div>")).to.equal('test')
    expect(self.filters.strip_html("<script type='text/javascript'>document.write('some stuff');</script>")).to.equal('')
    expect(self.filters.strip_html("<style type='text/css'>foo bar</style>")).to.equal('')
    expect(self.filters.strip_html("<div\nclass='multiline'>test</div>")).to.equal('test')
  }))
  describe('strip_newlines', () => it('strip all newlines (\n) from string', function () {
    expect(self.filters.strip_newlines('a\nb\nc')).to.equal('abc')
    expect(self.filters.strip_newlines('a\r\nb\nc')).to.equal('abc')
  }))
  describe('newline_to_br', () => it('replace each newline (\n) with html break', function () {
    expect(self.filters.newline_to_br('a\nb\nc')).to.equal('a<br />\nb<br />\nc')
  }))
  describe('replace', () => it('replace each occurrence', function () {
    expect(self.filters.replace('1 1 1 1', '1', '2')).to.equal('2 2 2 2')
  }))
  describe('replace_first', () => it('replace the first occurrence', function () {
    expect(self.filters.replace_first('1 1 1 1', '1', '2')).to.equal('2 1 1 1')
  }))
  describe('remove', () => it('remove each occurrence', function () {
    expect(self.filters.remove('a a a a', 'a')).to.equal('   ')
  }))
  describe('remove_first', () => it('remove the first occurrence', function () {
    expect(self.filters.remove_first('a a a a', 'a')).to.equal(' a a a')
  }))
  describe('date', () => {
    const parseDate = s => new Date(Date.parse(s))
    it('formats dates', function () {
      expect(self.filters.date(parseDate('2006-05-05 10:00:00'), '%B')).to.equal('May')
      expect(self.filters.date(parseDate('2006-06-05 10:00:00'), '%B')).to.equal('June')
      expect(self.filters.date(parseDate('2006-07-05 10:00:00'), '%B')).to.equal('July')
    })
    it('formats date strings', function () {
      expect(self.filters.date('2006-05-05 10:00:00', '%B')).to.equal('May')
      expect(self.filters.date('2006-06-05 10:00:00', '%B')).to.equal('June')
      expect(self.filters.date('2006-07-05 10:00:00', '%B')).to.equal('July')
    })
    it('formats without format', function () {
      expect(self.filters.date('2006-05-05 08:00:00 GMT')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.date('2006-05-05 08:00:00 GMT', undefined)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.date('2006-05-05 08:00:00 GMT', null)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.date('2006-05-05 08:00:00 GMT', '')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
    })
    it('formats with format', function () {
      expect(self.filters.date('2006-07-05 10:00:00', '%m/%d/%Y')).to.equal('07/05/2006')
      expect(self.filters.date('Fri Jul 16 01:00:00 2004', '%m/%d/%Y')).to.equal('07/16/2004')
    })
    it('formats the date when passing in now', function () {
      expect(self.filters.date('now', '%m/%d/%Y')).to.equal(strftime('%m/%d/%Y'))
    })
    it('ignores non-dates', function () {
      expect(self.filters.date(null, '%B')).to.equal('')
      expect(self.filters.date(undefined, '%B')).to.equal('')
    })
    it('formats numbers', function () {
      expect(self.filters.date(1152098955000, '%m/%d/%Y')).to.equal('07/05/2006')
      expect(self.filters.date('1152098955000', '%m/%d/%Y')).to.equal('07/05/2006')
    })
  })
  describe('truncate', () => it('truncates', function () {
    expect(self.filters.truncate('Lorem ipsum', 5)).to.equal('Lo...')
    expect(self.filters.truncate('Lorem ipsum', 5, '..')).to.equal('Lor..')
    expect(self.filters.truncate('Lorem ipsum', 0, '..')).to.equal('..')
    expect(self.filters.truncate('Lorem ipsum')).to.equal('Lorem ipsum')
    expect(self.filters.truncate('Lorem ipsum dolor sit amet, consetetur sadipscing elitr.')).to.equal('Lorem ipsum dolor sit amet, consetetur sadipsci...')
  }))
  describe('truncatewords', () => it('truncates', function () {
    expect(self.filters.truncatewords('Lorem ipsum dolor sit', 2)).to.equal('Lorem ipsum...')
    expect(self.filters.truncatewords('Lorem ipsum dolor sit', 2, '..')).to.equal('Lorem ipsum..')
    expect(self.filters.truncatewords('Lorem ipsum dolor sit', -2)).to.equal('Lorem...')
    expect(self.filters.truncatewords('', 1)).to.equal('')
    expect(self.filters.truncatewords('A B C D E F G H I J K L M N O P Q')).to.equal('A B C D E F G H I J K L M N O...')
  }))
  describe('minus', () => it('subtracts', function () {
    expect(self.filters.minus(2, 1)).to.equal(1)
  }))
  describe('plus', () => it('adds', function () {
    expect(self.filters.plus(2, 1)).to.equal(3)
  }))
  describe('times', () => it('multiplies', function () {
    expect(self.filters.times(2, 3)).to.equal(6)
  }))
  describe('dividedBy', () => it('divides', function () {
    expect(self.filters.dividedBy(8, 2)).to.equal(4)
    expect(self.filters.divided_by(8, 2)).to.equal(4)
  }))
  describe('round', () => it('rounds', function () {
    expect(self.filters.round(3.1415, 2)).to.equal('3.14')
    expect(self.filters.round(3.9999, 2)).to.equal('4.00')
  }))
  describe('modulo', () => it('applies modulo', function () {
    expect(self.filters.modulo(7, 3)).to.equal(1)
  }))
  describe('last', () => it('returns last element', function () {
    Promise.all([expect(self.filters.last([1, 2, 3])).to.become(3), expect(self.filters.last('abc')).to.become('c'), expect(self.filters.last(1)).to.become(1), expect(self.filters.last([])).to.eventually.not.exist, expect(self.filters.last(new Liquid.Range(0, 1000))).to.become(999)])
  }))
  describe('first', () => it('returns first element', function () {
    Promise.all([expect(self.filters.first([1, 2, 3])).to.become(1), expect(self.filters.first('abc')).to.become('a'), expect(self.filters.first(1)).to.become(1), expect(self.filters.first([])).to.eventually.not.exist, expect(self.filters.first(new Liquid.Range(0, 1000))).to.become(0)])
  }))
  describe('default', () => {
    it('uses the empty string as the default defaultValue', function () {
      expect(self.filters.default(undefined)).to.equal('')
    })
    it('allows using undefined values as defaultValue', function () {
      expect(self.filters.default(undefined, undefined)).to.equal('')
    })
    it('uses input for non-empty string', function () {
      expect(self.filters.default('foo', 'bar')).to.equal('foo')
    })
    it('uses default for undefined', function () {
      expect(self.filters.default(undefined, 'bar')).to.equal('bar')
    })
    it('uses default for null', function () {
      expect(self.filters.default(null, 'bar')).to.equal('bar')
    })
    it('uses default for false', function () {
      expect(self.filters.default(false, 'bar')).to.equal('bar')
    })
    it('uses default for blank string', function () {
      expect(self.filters.default('', 'bar')).to.equal('bar')
    })
    it('uses default for empty array', function () {
      expect(self.filters.default([], 'bar')).to.equal('bar')
    })
    it('uses default for empty object', function () {
      expect(self.filters.default({}, 'bar')).to.equal('bar')
    })
    it('uses input for number', function () {
      expect(self.filters.default(123, 'bar')).to.equal(123)
    })
    it('uses input for 0', function () {
      expect(self.filters.default(0, 'bar')).to.equal(0)
    })
  })
})
