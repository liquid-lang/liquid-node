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
    expect(self.filters.get('upcase')({
      toString () {
        return noop()
      }
    })).to.equal('FUNCTION () {}')
    expect(self.filters.get('upcase')({
      toString: null
    })).to.equal('[OBJECT OBJECT]')
  }))
  describe('taking array inputs', () => it('handles non-arrays', function () {
    expect(self.filters.get('sort')(1)).to.become([1])
  }))
  Array.from(Liquid.StandardFilters.entries()).forEach(function ([name, filter]) {
    describe(name, () => [null, undefined, true, false, 1, 'string', [], {}].forEach(param => {
      const paramString = JSON.stringify(param)
      it(`handles \`${paramString}\` as input`, () => expect(() => filter(param)).not.to.throw())
    }))
  })
  describe('size', () => {
    it("returns 0 for ''", function () {
      expect(self.filters.get('size')('')).to.equal(0)
    })
    it("returns 3 for 'abc'", function () {
      expect(typeof self.filters.get('size')).to.equal('function')
      expect(self.filters.get('size')('abc')).to.equal(3)
    })
    it('returns 0 for empty arrays', function () {
      expect(self.filters.get('size')([])).to.equal(0)
    })
    it('returns 3 for [1,2,3]', function () {
      expect(self.filters.get('size')([1, 2, 3])).to.equal(3)
    })
    it('returns 0 for numbers', function () {
      expect(self.filters.get('size')(1)).to.equal(0)
    })
    it('returns 0 for true', function () {
      expect(self.filters.get('size')(true)).to.equal(0)
    })
    it('returns 0 for false', function () {
      expect(self.filters.get('size')(false)).to.equal(0)
    })
    it('returns 0 for null', function () {
      expect(self.filters.get('size')(null)).to.equal(0)
    })
  })
  describe('downcase', () => {
    it('downcases strings', function () {
      expect(self.filters.get('downcase')('HiThere')).to.equal('hithere')
    })
    it('uses toString', function () {
      const o = {
        toString () {
          return 'aString'
        }
      }
      expect(self.filters.get('downcase')(o)).to.equal('astring')
    })
  })
  describe('upcase', () => {
    it('upcases strings', function () {
      expect(self.filters.get('upcase')('HiThere')).to.equal('HITHERE')
    })
    it('uses toString', function () {
      const o = {
        toString () {
          return 'aString'
        }
      }
      expect(self.filters.get('upcase')(o)).to.equal('ASTRING')
    })
  })
  describe('join', () => it('joins arrays', function () {
    Promise.all([expect(self.filters.get('join')([1, 2])).to.become('1 2'), expect(self.filters.get('join')([1, 2], '-')).to.become('1-2'), expect(self.filters.get('join')([])).to.become(''), expect(self.filters.get('join')(new Liquid.Range(1, 5))).to.become('1 2 3 4')])
  }))
  describe('split', () => it('splits strings', function () {
    expect(self.filters.get('split')('1-2-3', '-')).to.deep.equal(['1', '2', '3'])
    return expect(self.filters.get('split')('', '-')).to.not.exist
  }))
  describe('append', () => it('appends strings', function () {
    expect(self.filters.get('append')('Hi', 'There')).to.equal('HiThere')
  }))
  describe('prepend', () => it('prepends strings', function () {
    expect(self.filters.get('prepend')('There', 'Hi')).to.equal('HiThere')
  }))
  describe('capitalize', () => it('capitalizes words in the input sentence', function () {
    expect(self.filters.get('capitalize')('hi there.')).to.equal('Hi there.')
  }))
  describe('sort', () => {
    it('sorts elements in array', function () {
      expect(self.filters.get('sort')([1, 3, 2])).to.become([1, 2, 3])
    })
    it('sorts non-primitive elements in array via property', function () {
      expect(self.filters.get('sort')([
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
      expect(self.filters.get('sort')(input, 'count')).to.become([input[1], input[0], input[2]])
    })
  })
  describe('map', () => {
    it('maps array without property', function () {
      expect(self.filters.get('map')([1, 2, 3])).to.deep.equal([1, 2, 3])
    })
    it('maps array with property', function () {
      expect(self.filters.get('map')([
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
    expect(self.filters.get('escape')('<strong>')).to.equal('&lt;strong&gt;')
  }))
  describe('escape_once', () => it('returns an escaped version of html without affecting existing escaped entities', function () {
    expect(self.filters.get('escape_once')('&lt;strong&gt;Hulk</strong>')).to.equal('&lt;strong&gt;Hulk&lt;/strong&gt;')
  }))
  describe('strip_html', () => it('strip html from string', function () {
    expect(self.filters.get('strip_html')('<div>test</div>')).to.equal('test')
    expect(self.filters.get('strip_html')("<div id='test'>test</div>")).to.equal('test')
    expect(self.filters.get('strip_html')("<script type='text/javascript'>document.write('some stuff');</script>")).to.equal('')
    expect(self.filters.get('strip_html')("<style type='text/css'>foo bar</style>")).to.equal('')
    expect(self.filters.get('strip_html')("<div\nclass='multiline'>test</div>")).to.equal('test')
  }))
  describe('strip_newlines', () => it('strip all newlines (\n) from string', function () {
    expect(self.filters.get('strip_newlines')('a\nb\nc')).to.equal('abc')
    expect(self.filters.get('strip_newlines')('a\r\nb\nc')).to.equal('abc')
  }))
  describe('newline_to_br', () => it('replace each newline (\n) with html break', function () {
    expect(self.filters.get('newline_to_br')('a\nb\nc')).to.equal('a<br />\nb<br />\nc')
  }))
  describe('replace', () => it('replace each occurrence', function () {
    expect(self.filters.get('replace')('1 1 1 1', '1', '2')).to.equal('2 2 2 2')
  }))
  describe('replace_first', () => it('replace the first occurrence', function () {
    expect(self.filters.get('replace_first')('1 1 1 1', '1', '2')).to.equal('2 1 1 1')
  }))
  describe('remove', () => it('remove each occurrence', function () {
    expect(self.filters.get('remove')('a a a a', 'a')).to.equal('   ')
  }))
  describe('remove_first', () => it('remove the first occurrence', function () {
    expect(self.filters.get('remove_first')('a a a a', 'a')).to.equal(' a a a')
  }))
  describe('date', () => {
    const parseDate = s => new Date(Date.parse(s))
    it('formats dates', function () {
      expect(self.filters.get('date')(parseDate('2006-05-05 10:00:00'), '%B')).to.equal('May')
      expect(self.filters.get('date')(parseDate('2006-06-05 10:00:00'), '%B')).to.equal('June')
      expect(self.filters.get('date')(parseDate('2006-07-05 10:00:00'), '%B')).to.equal('July')
    })
    it('formats date strings', function () {
      expect(self.filters.get('date')('2006-05-05 10:00:00', '%B')).to.equal('May')
      expect(self.filters.get('date')('2006-06-05 10:00:00', '%B')).to.equal('June')
      expect(self.filters.get('date')('2006-07-05 10:00:00', '%B')).to.equal('July')
    })
    it('formats without format', function () {
      expect(self.filters.get('date')('2006-05-05 08:00:00 GMT')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.get('date')('2006-05-05 08:00:00 GMT', undefined)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.get('date')('2006-05-05 08:00:00 GMT', null)).to.equal('Fri, 05 May 2006 08:00:00 GMT')
      expect(self.filters.get('date')('2006-05-05 08:00:00 GMT', '')).to.equal('Fri, 05 May 2006 08:00:00 GMT')
    })
    it('formats with format', function () {
      expect(self.filters.get('date')('2006-07-05 10:00:00', '%m/%d/%Y')).to.equal('07/05/2006')
      expect(self.filters.get('date')('Fri Jul 16 01:00:00 2004', '%m/%d/%Y')).to.equal('07/16/2004')
    })
    it('formats the date when passing in now', function () {
      expect(self.filters.get('date')('now', '%m/%d/%Y')).to.equal(strftime('%m/%d/%Y'))
    })
    it('ignores non-dates', function () {
      expect(self.filters.get('date')(null, '%B')).to.equal('')
      expect(self.filters.get('date')(undefined, '%B')).to.equal('')
    })
    it('formats numbers', function () {
      expect(self.filters.get('date')(1152098955000, '%m/%d/%Y')).to.equal('07/05/2006')
      expect(self.filters.get('date')('1152098955000', '%m/%d/%Y')).to.equal('07/05/2006')
    })
  })
  describe('truncate', () => it('truncates', function () {
    expect(self.filters.get('truncate')('Lorem ipsum', 5)).to.equal('Lo...')
    expect(self.filters.get('truncate')('Lorem ipsum', 5, '..')).to.equal('Lor..')
    expect(self.filters.get('truncate')('Lorem ipsum', 0, '..')).to.equal('..')
    expect(self.filters.get('truncate')('Lorem ipsum')).to.equal('Lorem ipsum')
    expect(self.filters.get('truncate')('Lorem ipsum dolor sit amet, consetetur sadipscing elitr.')).to.equal('Lorem ipsum dolor sit amet, consetetur sadipsci...')
  }))
  describe('truncatewords', () => it('truncates', function () {
    expect(self.filters.get('truncatewords')('Lorem ipsum dolor sit', 2)).to.equal('Lorem ipsum...')
    expect(self.filters.get('truncatewords')('Lorem ipsum dolor sit', 2, '..')).to.equal('Lorem ipsum..')
    expect(self.filters.get('truncatewords')('Lorem ipsum dolor sit', -2)).to.equal('Lorem...')
    expect(self.filters.get('truncatewords')('', 1)).to.equal('')
    expect(self.filters.get('truncatewords')('A B C D E F G H I J K L M N O P Q')).to.equal('A B C D E F G H I J K L M N O...')
  }))
  describe('minus', () => it('subtracts', function () {
    expect(self.filters.get('minus')(2, 1)).to.equal(1)
  }))
  describe('plus', () => it('adds', function () {
    expect(self.filters.get('plus')(2, 1)).to.equal(3)
  }))
  describe('times', () => it('multiplies', function () {
    expect(self.filters.get('times')(2, 3)).to.equal(6)
  }))
  describe('dividedBy', () => it('divides', function () {
    expect(self.filters.get('dividedBy')(8, 2)).to.equal(4)
    expect(self.filters.get('divided_by')(8, 2)).to.equal(4)
  }))
  describe('round', () => it('rounds', function () {
    expect(self.filters.get('round')(3.1415, 2)).to.equal('3.14')
    expect(self.filters.get('round')(3.9999, 2)).to.equal('4.00')
  }))
  describe('modulo', () => it('applies modulo', function () {
    expect(self.filters.get('modulo')(7, 3)).to.equal(1)
  }))
  describe('last', () => it('returns last element', function () {
    Promise.all([expect(self.filters.get('last')([1, 2, 3])).to.become(3), expect(self.filters.get('last')('abc')).to.become('c'), expect(self.filters.get('last')(1)).to.become(1), expect(self.filters.get('last')([])).to.eventually.not.exist, expect(self.filters.get('last')(new Liquid.Range(0, 1000))).to.become(999)])
  }))
  describe('first', () => it('returns first element', function () {
    Promise.all([expect(self.filters.get('first')([1, 2, 3])).to.become(1), expect(self.filters.get('first')('abc')).to.become('a'), expect(self.filters.get('first')(1)).to.become(1), expect(self.filters.get('first')([])).to.eventually.not.exist, expect(self.filters.get('first')(new Liquid.Range(0, 1000))).to.become(0)])
  }))
  describe('default', () => {
    it('uses the empty string as the default defaultValue', function () {
      expect(self.filters.get('default')(undefined)).to.equal('')
    })
    it('allows using undefined values as defaultValue', function () {
      expect(self.filters.get('default')(undefined, undefined)).to.equal('')
    })
    it('uses input for non-empty string', function () {
      expect(self.filters.get('default')('foo', 'bar')).to.equal('foo')
    })
    it('uses default for undefined', function () {
      expect(self.filters.get('default')(undefined, 'bar')).to.equal('bar')
    })
    it('uses default for null', function () {
      expect(self.filters.get('default')(null, 'bar')).to.equal('bar')
    })
    it('uses default for false', function () {
      expect(self.filters.get('default')(false, 'bar')).to.equal('bar')
    })
    it('uses default for blank string', function () {
      expect(self.filters.get('default')('', 'bar')).to.equal('bar')
    })
    it('uses default for empty array', function () {
      expect(self.filters.get('default')([], 'bar')).to.equal('bar')
    })
    it('uses default for empty object', function () {
      expect(self.filters.get('default')({}, 'bar')).to.equal('bar')
    })
    it('uses input for number', function () {
      expect(self.filters.get('default')(123, 'bar')).to.equal(123)
    })
    it('uses input for 0', function () {
      expect(self.filters.get('default')(0, 'bar')).to.equal(0)
    })
  })
})
