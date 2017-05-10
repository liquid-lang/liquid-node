const FilterSeparator = /\|/
const ArgumentSeparator = /,/
const FilterArgumentSeparator = /:/
const VariableAttributeSeparator = /\./
const TagStart = /\{%/
const TagEnd = /%\}/
const VariableSignature = /\(?[.\w\-[\]]\)?/
const VariableSegment = /[\w-]/
const VariableStart = /\{\{/
const VariableEnd = /\}\}/
const VariableIncompleteEnd = /\}\}?/
const QuotedString = /"[^"]*"|'[^']*'/
const QuotedFragment = RegExp(QuotedString.source + "|(?:[^\\s,\\|'\"]|" + QuotedString.source + ')+')
const StrictQuotedFragment = /"[^"]+"|'[^']+'|[^\s|:,]+/
const FirstFilterArgument = RegExp(FilterArgumentSeparator.source + '(?:' + StrictQuotedFragment.source + ')')
const OtherFilterArgument = RegExp(ArgumentSeparator.source + '(?:' + StrictQuotedFragment.source + ')')
const SpacelessFilter = RegExp("^(?:'[^']+'|\"[^\"]+\"|[^'\"])*" + FilterSeparator.source + '(?:' + StrictQuotedFragment.source + ')(?:' + FirstFilterArgument.source + '(?:' + OtherFilterArgument.source + ')*)?')
const Expression = RegExp('(?:' + QuotedFragment.source + '(?:' + SpacelessFilter.source + ')*)')
const TagAttributes = RegExp('(\\w+)\\s*\\:\\s*(' + QuotedFragment.source + ')')
const AnyStartingTag = /\{\{|\{%/
const PartialTemplateParser = RegExp(TagStart.source + '.*?' + TagEnd.source + '|' + VariableStart.source + '.*?' + VariableIncompleteEnd.source)
const TemplateParser = RegExp('(' + PartialTemplateParser.source + '|' + AnyStartingTag.source + ')')
const VariableParser = RegExp('\\[[^\\]]+\\]|' + VariableSegment.source + '+\\??')

export {
  FilterSeparator,
  ArgumentSeparator,
  FilterArgumentSeparator,
  VariableAttributeSeparator,
  TagStart,
  TagEnd,
  VariableSignature,
  VariableSegment,
  VariableStart,
  VariableEnd,
  VariableIncompleteEnd,
  QuotedString,
  QuotedFragment,
  StrictQuotedFragment,
  FirstFilterArgument,
  OtherFilterArgument,
  SpacelessFilter,
  Expression,
  TagAttributes,
  AnyStartingTag,
  PartialTemplateParser,
  TemplateParser,
  VariableParser
}
