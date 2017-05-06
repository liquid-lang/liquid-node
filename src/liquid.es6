class Liquid {
  static FilterSeparator = /\|/
  static ArgumentSeparator = /,/
  static FilterArgumentSeparator = /:/
  static VariableAttributeSeparator = /\./
  static TagStart = /\{%/
  static TagEnd = /%\}/
  static VariableSignature = /\(?[.\w\-[\]]\)?/
  static VariableSegment = /[\w-]/
  static VariableStart = /\{\{/
  static VariableEnd = /\}\}/
  static VariableIncompleteEnd = /\}\}?/
  static QuotedString = /"[^"]*"|'[^']*'/
  static QuotedFragment = RegExp(Liquid.QuotedString.source + "|(?:[^\\s,\\|'\"]|" + Liquid.QuotedString.source + ')+')
  static StrictQuotedFragment = /"[^"]+"|'[^']+'|[^\s|:,]+/
  static FirstFilterArgument = RegExp(Liquid.FilterArgumentSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')')
  static OtherFilterArgument = RegExp(Liquid.ArgumentSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')')
  static SpacelessFilter = RegExp("^(?:'[^']+'|\"[^\"]+\"|[^'\"])*" + Liquid.FilterSeparator.source + '(?:' + Liquid.StrictQuotedFragment.source + ')(?:' + Liquid.FirstFilterArgument.source + '(?:' + Liquid.OtherFilterArgument.source + ')*)?')
  static Expression = RegExp('(?:' + Liquid.QuotedFragment.source + '(?:' + Liquid.SpacelessFilter.source + ')*)')
  static TagAttributes = RegExp('(\\w+)\\s*\\:\\s*(' + Liquid.QuotedFragment.source + ')')
  static AnyStartingTag = /\{\{|\{%/
  static PartialTemplateParser = RegExp(Liquid.TagStart.source + '.*?' + Liquid.TagEnd.source + '|' + Liquid.VariableStart.source + '.*?' + Liquid.VariableIncompleteEnd.source)
  static TemplateParser = RegExp('(' + Liquid.PartialTemplateParser.source + '|' + Liquid.AnyStartingTag.source + ')')
  static VariableParser = RegExp('\\[[^\\]]+\\]|' + Liquid.VariableSegment.source + '+\\??')
}
export default Liquid
