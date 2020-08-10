const Liquid = require('../liquid')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const PathPattern = /^[^./][a-zA-Z0-9-_/]+$/

module.exports = class LocalFileSystem extends Liquid.BlankFileSystem {
  constructor (root, extension) {
    super()
    if (extension == null) {
      extension = 'html'
    }
    this.root = root
    this.fileExtension = extension
  }

  async readTemplateFile (templatePath) {
    const fullPath = await this.fullPath(templatePath)
    try {
      const contents = await readFile(fullPath, 'utf8')
      return contents
    } catch (err) {
      throw new Liquid.FileSystemError('Error loading template: ' + err.message)
    }
  }

  async fullPath (templatePath) {
    if (PathPattern.test(templatePath)) {
      return path.resolve(path.join(this.root, templatePath + ('.' + this.fileExtension)))
    } else {
      throw new Liquid.ArgumentError(`Illegal template name '${templatePath}'`)
    }
  }
}
