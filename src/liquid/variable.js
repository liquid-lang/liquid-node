// @flow
import { ArgumentSeparator, FilterArgumentSeparator, FilterSeparator, QuotedFragment } from './regexps';
import { flatten, scan } from './helpers';
import Context from './context';
import Drop from './drop';
import { FilterNotFound } from './errors';
import PromiseReduce from '../promise_reduce';

const filterListFragment = RegExp(`${FilterSeparator.source}\\s*(.*)`);
const filterArgParser = RegExp(`(?:${
    FilterArgumentSeparator.source}|${ArgumentSeparator.source})\\s*(${QuotedFragment.source})`);

class Variable {
  static filterParser = RegExp(`(?:${
      FilterSeparator.source}|(?:\\s*(?!(?:${
          FilterSeparator.source}))(?:${QuotedFragment.source}|\\S+)\\s*)+)`);
  filters: Map<string, string[]> = new Map();
  name: string = '';
  markup: string;
  constructor(markup: string) {
    this.markup = markup;
    let match = Variable.filterParser.exec(this.markup);
    if (!match) return;
    if (match.length === 1) {
      this.name = match[0];
    } else {
      this.name = match[1];
    }
    this.name = this.name.replace(/\s*/g, '');
    match = filterListFragment.exec(match[2]);
    if (!match) return;
    const self = this;
    const filters = scan(match[1], Variable.filterParser);
    filters.forEach((filter) => {
      match = /\s*(\w+)/.exec(filter);
      if (!match) return;
      const filterName = match[1];
      const filterArgs = flatten(scan(filter, filterArgParser));
      return self.filters.set(filterName, filterArgs);
    });
  }
  async render(context: Context) {
    if (this.name === '') {
      return '';
    }
    const self = this;
    async function reducer(input: Promise<string>, filter: [string, string[]]) {
      const [filterName, args] = filter;
      const filterArgs = args.map(a => context.get(a));
      const results = [(await input)].concat(...filterArgs);
      try {
        return context.invoke([filterName, input].concat(...results));
      } catch (e) {
        if (!(e instanceof FilterNotFound)) {
          throw e;
        }
      }
      try {
        let filtered;
        const value = await context.get(self.name);
        switch (self.filters.size) {
          case 0:
            filtered = await value;
            break;
          case 1:
            filtered = await reducer(value, Object.values(self.filters)[0]);
            break;
          default:
            filtered = await PromiseReduce(Object.values(self.filters), reducer, value);
        }
        if (!(filtered instanceof Drop)) {
          return filtered;
        }
        filtered.context = context;
        return filtered.toString();
      } catch (e) {
        return context.handleError(e);
      }
    }
  }
}

export default Variable;
