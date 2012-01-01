util = require "util"

loadTags = () ->
	tagDir = "#{__dirname}/liquid/tags"
	require("fs").readdirSync(tagDir).forEach (file) ->
	  if /\.(coffee|js|node)$/.test(file)
	    fullFile = tagDir + "/" + file
	    require(fullFile)
	
Liquid = require "./liquid_base"

Liquid.Helpers          = require("./liquid/helpers")
Liquid.Drop             = require("./liquid/drop")
Liquid.Strainer         = require("./liquid/strainer")
Liquid.Context          = require("./liquid/context")
Liquid.Tag              = require("./liquid/tag")
Liquid.Block            = require("./liquid/block")
Liquid.Document         = require("./liquid/document")
Liquid.Variable         = require("./liquid/variable")
Liquid.Template         = require("./liquid/template")
Liquid.StandardFilters  = require("./liquid/standard_filters")
Liquid.Condition        = require("./liquid/condition")

class Liquid.ElseCondition extends Liquid.Condition
  else: -> true
  evaluate: -> true

Liquid.Template.registerFilter(Liquid.StandardFilters)

# TODO
# HtmlTags, FileSystem

# Load Tags
loadTags()

module.exports = Liquid
