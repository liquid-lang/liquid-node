// @flow

export type Token = {
  value: string,
  filename: string,
  line: number,
  col: number,
};

export function flatten(array: string[]): string[] {
  const output: string[] = [];
  const internalFlatten = (arr: string[]) => arr.forEach((item: string[] | string) => {
    if (Array.isArray(item)) {
      return internalFlatten(item);
    }
    return output.push(item);
  });
  internalFlatten(array);
  return output;
}
export function toFlatString(array: string[]) {
  return flatten(array).join('');
}
export function scan(string: string, regexp: RegExp, globalMatch: boolean = false): string[] {
  const result: string[] = [];
  const internalScan = (s: string) => {
    const match = regexp.exec(s);
    if (match) {
      if (match.length === 1) {
        result.push(match[0]);
      } else {
        result.push(...match.slice(1));
      }
      const l = (globalMatch) ? 1 : match[0].length;
      if (match.index + l < s.length) {
        return internalScan(s.substring(match.index + l));
      }
    }
    return null;
  };
  internalScan(string);
  return result;
}

