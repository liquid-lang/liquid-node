const Liquid = require('../liquid')

module.exports = class BlankFileSystem {
  async readTemplateFile () {
    throw new Liquid.FileSystemError("This file system doesn't allow includes")
  }
}
