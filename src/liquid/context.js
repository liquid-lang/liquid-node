// @flow
import * as helpers from './helpers';

import { ContextError, Error, FilterNotFound, SyntaxError } from './errors';

import Drop from './drop';
import Engine from './engine';
import Range from './range';
import { VariableParser } from './regexps';

class Context {
  static LITERALS = new Map([
  ['nil', null],
  ['null', null],
  ['', null],
  ['true', true],
  ['false', false],
  ]);
  internalEnvironments: Map<string, any>[];
  scopes: Map<string, any>[];
  registers: Map<string, any> = new Map();
  errors: Error[];
  rethrowErrors = false;
  strainer: typeof Engine.prototype.Strainer = new Map();
  constructor(engine: Engine, environments: Map<string, any>[] = [],
    outerScope: Map<string, any> = new Map(), registers: Map<string, any> = new Map(),
    rethrowErrors: boolean = false) {
    this.environments = environments;
    this.scopes = [outerScope];
    this.registers = registers;
    this.errors = [];
    this.rethrowErrors = rethrowErrors;
    if (engine) {
      this.strainer = engine.Strainer;
    }
    this.squashInstanceAssignsWithEnvironments();
  }
  get environments(): Map<string, any>[] {
    return this.internalEnvironments;
  }
  set environments(v: Map<string, any>[]) {
    this.internalEnvironments = v;
  }
  /**
  * Adds filters to this context.
  *
  * Note that this does not register the filters with the main Template object.
  * See {@link Template#registerFilter} for that.
  */
  registerFilters(filters: Map<string, Function>) {
    const self = this;
    Object.entries(filters)
    .map(([k, v]) => self.strainer.set(k, v));
  }
  handleError(e: Error) {
    this.errors.push(e);
    if (this.rethrowErrors) {
      throw e;
    }
    if (e instanceof SyntaxError) {
      return `Liquid syntax error: ${e.message}`;
    }
    return `Liquid error: ${e.message}`;
  }
  invoke(methodName: string, ...args: any[]) {
    if (this.strainer.has(methodName)) {
      const method = this.strainer.get(methodName);
      if (method) {
        return method(...args);
      }
    } // else
    throw new FilterNotFound(`Unknown filter \`${
      methodName}\`, available: [${Object.keys(this.strainer).join(', ')}]`);
  }
  push(newScope: Map<string, any> = new Map()) {
    this.scopes.unshift(newScope);
    if (this.scopes.length > 100) {
      throw new Error('Nesting too deep');
    }
  }
  merge(newScope: Map<string, any> = new Map()) {
    const currentScope = this.scopes[0];
    Object.entries(newScope).forEach(([key, val]) => currentScope.set(key, val));
    this.scopes[0] = currentScope;
  }
  pop() {
    if (this.scopes.length <= 1) {
      throw new ContextError();
    }
    return this.scopes.shift();
  }
  lastScope() {
    return this.scopes[this.scopes.length - 1];
  }
  stack(f: Function, newScope: Map<string, any> = new Map()) {
    let popLater = false;
    try {
      const self = this;
      this.push(newScope);
      const result = f();
      if (result != null && result.nodeify != null) {
        popLater = true;
        result.nodeify(() => self.pop());
      }
      return result;
    } catch (e) {}
    if (!popLater) {
      return this.pop();
    }
  }
  clearInstanceAssigns() {
    this.scopes[0].clear();
  }
  async set(key: string, value: any) {
    this.scopes[0].set(key, value);
  }
  async get(key: string) {
    return this.resolve(key);
  }
  async hasKey(key: string) {
    const v = await this.resolve(key);
    return v != null;
  }
  async has(key: string) {
    return this.hasKey(key);
  }
  async resolve(key: string) {
    if (Context.LITERALS.has(key)) {
      return Context.LITERALS.get(key);
    }
    let match = /^'(.*)'$/.exec(key);
    if (match) {
      return match[1];
    }
    match = /^"(.*)"$/.exec(key);
    if (match) {
      return match[1];
    }
    match = /^(\d+)$/.exec(key);
    if (match) {
      return Number(match[1]);
    }
    match = /^\((\S+)\.\.(\S+)\)$/.exec(key); // Ranges
    if (match) {
      const lo: number = Number(await this.resolve(match[1]));
      const hi: number = Number(await this.resolve(match[2]));
      if (Number.isNaN(lo) || Number.isNaN(hi)) {
        return [];
      }
      return new Range(lo, hi + 1);
    }
    match = /^(\d[\d.]+)$/.exec(key);
    if (match) {
      return Number(match[1]);
    }
    return this.variable(key);
  }
  async findVariable(key: string) {
    let variable;
    let variableScope;
    this.scopes.some((scope) => {
      if (scope.has(key)) {
        variableScope = scope;
        return true;
      }
      return false;
    });
    if (variableScope == null) {
      this.environments.some((env) => {
        variable = Context.lookupAndEvaluate(env, key);
        if (variable != null) {
          variableScope = env;
          return true;
        }
        return false;
      });
    }
    if (variableScope == null) {
      if (this.environments.length > 0) {
        variableScope = this.environments[this.environments.length - 1];
      } else if (this.scopes.length > 0) {
        variableScope = this.scopes[this.scopes.length - 1];
      } else {
        throw new Error('No scopes to find variable in.');
      }
    }
    if (variable != null) {
      variable = Context.lookupAndEvaluate(variableScope, key);
    }
    const v = await variable;
    return this.liquify(v);
    // return Promise.resolve(variable).then(v => self.liquify(v));
  }
    /**
    * If object is a hash- or array-like object we look for the
    * presence of the key and if its available we return it
    */
  static async hashLikeAccess(context: Context, object: any, part: string) {
    return context.liquify(Context.lookupAndEvaluate(object, part));
  }

    /**
    * Some special cases.
    * If the part wasn't in square brackets
    * and no key with the same name was found we interpret
    * following calls as commands and call them on the
    * current object
    */
  static async specialAccess(context: Context, object: any[], part: string) {
    switch (part) {
      case 'size':
        return context.liquify(object.length);
      case 'first':
        return context.liquify(object[0]);
      case 'first':
        return context.liquify(object[object.length - 1]);
      default:
        /* @covignore */
        throw new Error(`Unknown special accessor: ${part}`);
    }
  }
  async variable(markup: string) {
    const self = this;
    const parts = await helpers.scan(markup, VariableParser);
    const squareBracketed = /^\[(.*)\]$/;

    let firstPart = parts.shift();
    const match = squareBracketed.exec(firstPart);
    if (match) {
      firstPart = match[1];
    }
    const object = await this.findVariable(firstPart);
    if (parts.length === 0) {
      return object;
    }
    const liquify = this.liquify;
    const resolve = this.resolve;
    const mapper = async (part: any, obj: any) => {
      if (obj == null) {
        return obj;
      }
      const o = await liquify(obj);
      if (o == null) {
        return o;
      }
      const bracketMatch = squareBracketed.exec(part);
      let p;
      if (bracketMatch) {
        p = await resolve(bracketMatch[1]);
      }
      const isArrayAccess = (Array.isArray(o) && Number.isFinite(p));
      const isObjectAccess = (o instanceof Object && (o.hasKey(p) || p in o));
      const isSpecialAccess = (!bracketMatch && o &&
        (Array.isArray(o) ||
        Object.prototype.toString.call(o) === '[object String]')
        && ['size', 'first', 'last'].includes(p));
      if (isArrayAccess || isObjectAccess) {
        return Context.hashLikeAccess(self, o, p);
      } else if (isSpecialAccess) {
        return Context.specialAccess(self, o, p);
      }
    };
      // The iterator walks through the parsed path step
      // by step and waits for promises to be fulfilled.
    async function iterator(object: any, index: number): Promise<any> {
      if (index < parts.length) {
        const tmp: any = await mapper(parts[index], object);
        return iterator(tmp, index + 1);
      }
      return object;
    }
    try {
      return iterator(object, 0);
    } catch (err) {
      throw new Error(`Couldn't walk variable: ${markup}: ${err}`);
    }
  }
  static lookupAndEvaluate(obj: any, key: string) {
    if (obj != null) {
      if (typeof obj.get === 'function') {
        return obj.get(key);
      }
      return obj[key];
    }
    return null;
  }
  squashInstanceAssignsWithEnvironments() {
    const lastScope = this.lastScope();
    const environments = this.environments;
    return Object.keys(lastScope).forEach(key => environments.some((env) => {
      if (env.has(key)) {
        lastScope.set(key, Context.lookupAndEvaluate(env, key));
        return true;
      }
      return false;
    }));
  }
  async liquify(object: any) {
    let obj = await object;
    if (obj == null) {
      return obj;
    }
    if (typeof object.toLiquid === 'function') {
      obj = object.toLiquid();
    } else if (typeof obj === 'object') {
      return true;
    } else if (typeof obj === 'function') {
      obj = '';
    } else {
      Object.prototype.toString.call(object);
    }
    if (obj instanceof Drop) {
      obj.context = this;
    }
    return obj;
  }
}

export default Context;
