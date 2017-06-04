// @flow
import { FileSystemError } from './errors';

class BlankFileSystem {
  async readTemplateFile(templatePath: string) {
    console.error(templatePath);
    throw new FileSystemError('This file system doesn\'t allow includes');
  }
}

export default BlankFileSystem;
