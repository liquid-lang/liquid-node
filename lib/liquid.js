class Liquid {}

Liquid.FilterSeparator = /\|/
Liquid.ArgumentSeparator = /,/
Liquid.FilterArgumentSeparator = /:/
Liquid.VariableAttributeSeparator = /\./
Liquid.TagStart = /\{%/
Liquid.TagEnd = /%\}/
Liquid.VariableSignature = /\(?[\w\-.[\]]\)?/
Liquid.VariableSegment = /[\w-]/
Liquid.VariableStart = /\{\{/
Liquid.VariableEnd = /\}\}/
Liquid.VariableIncompleteEnd = /\}\}?/
Liquid.QuotedString = /"[^"]*"|'[^']*'/
Liquid.QuotedFragment = RegExp(Liquid.QuotedString.source + "|(?:[^\\s,\\|'\"]|" + Liquid.QuotedString.source + ')+')
Liquid.StrictQuotedFragment = /"[^"]+"|'[^']+'|[^\s|:,]+/
Liquid.FirstFilterArgument = RegExp(Liquid.FilterArgumentSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')')
Liquid.OtherFilterArgument = RegExp(Liquid.ArgumentSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')')
Liquid.SpacelessFilter = RegExp("^(?:'[^']+'|\"[^\"]+\"|[^'\"])*" + Liquid.FilterSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')(?:' + Liquid.FirstFilterArgument.source + '(?:' + Liquid.OtherFilterArgument.source + ')*)?')
Liquid.Expression = RegExp('(?:' + Liquid.QuotedFragment.source + '(?:' + Liquid.SpacelessFilter.source + ')*)')
Liquid.TagAttributes = RegExp('(\\w+)\\s*\\:\\s*(' + Liquid.QuotedFragment.source + ')')
Liquid.AnyStartingTag = /\{\{|\{%/
Liquid.PartialTemplateParser = RegExp(Liquid.TagStart.source + '.*?' + Liquid.TagEnd.source + '|' + Liquid.VariableStart.source + '.*?' + Liquid.VariableIncompleteEnd.source)
Liquid.TemplateParser = RegExp('(' + Liquid.PartialTemplateParser.source + '|' + Liquid.AnyStartingTag.source + ')')
Liquid.VariableParser = RegExp('\\[[^\\]]+\\]|' + Liquid.VariableSegment.source + '+\\??')

module.exports = Liquid
