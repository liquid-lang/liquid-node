// @flow

import * as Promise from 'any-promise';

const reduce = (collection: any[], reducer: Function, value: any) =>
  Promise.all(collection).then(items =>
    items.reduce((promise, item, index, length) =>
      promise.then((val: any) => reducer(val, item, index, length)),
      Promise.resolve(value)));

export default reduce;
