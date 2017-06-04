// @flow
import fs from 'fs';
import path from 'path';

import { ArgumentError, FileSystemError } from './errors';

import BlankFileSystem from './blank_file_system';

const readFile = async (fpath: string, encoding: string) => {
  let retVal: string;
  fs.readFile(fpath, encoding, async (err: Error, content: string) => {
    if (err) {
      throw err;
    }
    retVal = await content;
  });
  return retVal;
};


const pathPattern = /^[^./][a-zA-Z0-9-_/]+$/;

class LocalFileSystem extends BlankFileSystem {
  root: string;
  fileExtension: string;
  constructor(root: string, extension: string = 'html') {
    super();
    this.root = root;
    this.fileExtension = extension;
  }

  async readTemplateFile(templatePath: string) {
    try {
      const fullPath = await this.fullPath(templatePath);
      return readFile(fullPath, 'utf8');
    } catch (err) {
      throw new FileSystemError(`Error loading template: ${err.message}`);
    }
  }

  async fullPath(templatePath: string) {
    try {
      if (pathPattern.test(templatePath)) {
        return path.resolve(path.join(
        this.root,
        `${templatePath}.${this.fileExtension}`,
        ));
      }
    } catch (e) {
      throw new ArgumentError(`Illegal template name '${templatePath}'`);
    }
  }
}
export default LocalFileSystem;
