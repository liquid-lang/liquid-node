Liquid = require "../liquid"
Promise = require "any-promise"

module.exports = class Liquid.BlankFileSystem
  constructor: () ->

  readTemplateFile: (templatePath) ->
    Promise.reject new Liquid.FileSystemError "This file system doesn't allow includes"
