const Liquid = require('../liquid')

module.exports = Liquid.BlankFileSystem = (function () {
  function BlankFileSystem () {}

  BlankFileSystem.prototype.readTemplateFile = function (templatePath) {
    return Promise.reject(new Liquid.FileSystemError("This file system doesn't allow includes"))
  }

  return BlankFileSystem
})()
