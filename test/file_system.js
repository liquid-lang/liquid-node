const Liquid = require('..')
const Path = require('path')

describe('Liquid.FileSystem', function () {
  describe('Liquid.BlankFileSystem', () =>
    it('should error', function () {
      const c = new Liquid.BlankFileSystem()
      return expect(c.readTemplateFile('index')).to.be.rejectedWith(Liquid.FileSystemError, "This file system doesn't allow includes")
    })
  )

  return describe('Liquid.LocalFileSystem', function () {
    it('evaluates the correct path', function () {
      const c = new Liquid.LocalFileSystem('./')
      return expect(c.fullPath('index')).to.be.fulfilled.then(v => expect(v).to.equal(Path.resolve('index.html')))
    })

    it('evaluates the correct path and extension', function () {
      const c = new Liquid.LocalFileSystem('./root/files', 'html2')
      return expect(c.fullPath('index')).to.be.fulfilled.then(v => expect(v).to.equal(Path.resolve('root/files/index.html2')))
    })

    it('loads the file', function () {
      const c = new Liquid.LocalFileSystem('./test/fixtures', 'test.html')
      return expect(c.readTemplateFile('filesystem')).to.be.fulfilled.then(v => expect(v).to.equal('<html></html>'))
    })

    it("throws an error when the file isn't found", function () {
      const c = new Liquid.LocalFileSystem('./', 'html')
      return expect(c.readTemplateFile('notfound')).to.be.rejectedWith(Liquid.FileSystemError, 'Error loading template')
    })

    return it("errors if the filename isn't valid", function () {
      const c = new Liquid.LocalFileSystem('./', 'html')
      return expect(c.fullPath('invalid file')).to.be.rejectedWith(Liquid.ArgumentError, "Illegal template name 'invalid file'")
    })
  })
})
