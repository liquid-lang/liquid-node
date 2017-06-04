// @flow
import { ArgumentError } from './errors';
import BlankFileSystem from './blank_file_system';
import Block from './block';
import StandardFilters from './standard_filters';
import Tag from './tag';
import Tags from './tags';
import Template from './template';

class Engine {
  tags: Map<string, Tag> = new Map();
  Strainer: Map<string, Function> = new Map();
  fileSystem = new BlankFileSystem();

  constructor() {
    const isSubclassOf = (klass: any, ofKlass: any) => {
      if (typeof klass !== 'function') {
        return false;
      }
      if (klass === ofKlass) {
        return true;
      }
      return klass instanceof ofKlass;
    };
    this.registerFilters(StandardFilters);
    const engine = this;
    Object.entries(Tags).forEach(([tag, func]) => {
      if (!isSubclassOf(func, Tag)) {
        return;
      }
      const isBlockOrTagBaseClass = [Tag, Block].includes(func.constructor);
      if (!isBlockOrTagBaseClass) {
        engine.registerTag(tag.toLowerCase(), func);
      }
    });
  }
  registerTag(name: string, tag: Tag) {
    this.tags.set(name, tag);
  }
  registerFilters(filters: Map<string, Function>) {
    Object.entries(filters)
         .filter(([key, fun]) => fun != null)
         .forEach(([key, fun]) => this.Strainer.set(key, fun));
  }
  async parse(source: string) {
    const template = new Template();
    return template.parse(this, source);
  }
  async parseAndRender(source: string, ...args: any[]) {
    const template = await this.parse(source);
    return template.render(...args);
  }
  registerFileSystem(fileSystem: BlankFileSystem) {
    if (!(fileSystem instanceof BlankFileSystem)) {
      throw new ArgumentError('Must be subclass of Liquid.BlankFileSystem');
    }
    this.fileSystem = fileSystem;
  }
}

export default Engine;
