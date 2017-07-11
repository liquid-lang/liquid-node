Liquid = require "../liquid"
Fs = require "fs"
Path = require "path"

readFile = (fpath, encoding) ->
  new Promise (resolve, reject) ->
    Fs.readFile fpath, encoding, (err, content) ->
      if (err)
        reject err
      else
        resolve content


module.exports = class Liquid.LocalFileSystem extends Liquid.BlankFileSystem

  PathPattern = ///^[^.\/][a-zA-Z0-9-_\/]+$///

  constructor: (root, extension = "html") ->
    @root = root
    @fileExtension = extension

  readTemplateFile: (templatePath) ->
    @fullPath(templatePath)
      .then (fullPath) ->
        readFile(fullPath, 'utf8').catch (err) ->
          throw new Liquid.FileSystemError "Error loading template: #{err.message}"

  fullPath: (templatePath) ->
    if PathPattern.test templatePath
      Promise.resolve Path.resolve(Path.join(@root, templatePath + ".#{@fileExtension}"))
    else
      Promise.reject new Liquid.ArgumentError "Illegal template name '#{templatePath}'"
