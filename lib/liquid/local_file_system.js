var readFile
const extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key] } function Ctor () { this.constructor = child } Ctor.prototype = parent.prototype; child.prototype = new Ctor(); child.__super__ = parent.prototype; return child }
const hasProp = {}.hasOwnProperty
const Liquid = require('../liquid')
const Fs = require('fs')
const Path = require('path')

readFile = function (fpath, encoding) {
  return new Promise(function (resolve, reject) {
    return Fs.readFile(fpath, encoding, function (err, content) {
      if (err) {
        return reject(err)
      } else {
        return resolve(content)
      }
    })
  })
}

module.exports = Liquid.LocalFileSystem = (function (superClass) {
  var PathPattern

  extend(LocalFileSystem, superClass)

  PathPattern = /^[^./][a-zA-Z0-9-_/]+$/

  function LocalFileSystem (root, extension) {
    if (extension == null) {
      extension = 'html'
    }
    this.root = root
    this.fileExtension = extension
  }

  LocalFileSystem.prototype.readTemplateFile = function (templatePath) {
    return this.fullPath(templatePath).then(function (fullPath) {
      return readFile(fullPath, 'utf8')['catch'](function (err) {
        throw new Liquid.FileSystemError('Error loading template: ' + err.message)
      })
    })
  }

  LocalFileSystem.prototype.fullPath = function (templatePath) {
    if (PathPattern.test(templatePath)) {
      return Promise.resolve(Path.resolve(Path.join(this.root, templatePath + ('.' + this.fileExtension))))
    } else {
      return Promise.reject(new Liquid.ArgumentError("Illegal template name '" + templatePath + "'"))
    }
  }

  return LocalFileSystem
})(Liquid.BlankFileSystem)
