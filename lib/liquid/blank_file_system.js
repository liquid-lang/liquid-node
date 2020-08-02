const Liquid = require('../liquid')

module.exports = Liquid.BlankFileSystem = class BlankFileSystem {
  async readTemplateFile () {
    throw new Liquid.FileSystemError("This file system doesn't allow includes")
  }
}
