Liquid = require('../src')

class CustomFileSystem extends Liquid.BlankFileSystem
  readTemplateFile: (path) ->
    new Promise (resolve, reject) ->
      if path is 'foo'
        resolve 'FOO'
      else if path is 'bar'
        resolve 'BAR'
      else
        reject 'not foo or bar'

engine = new Liquid.Engine
engine.fileSystem = new CustomFileSystem

engine.parse('{% include foo %} {% include bar %}')
.then (parsed) ->
  parsed.render()
.then (result) ->
  console.log "Rendered: #{result}"
.catch (err) ->
  console.log "Failed: #{err}"
