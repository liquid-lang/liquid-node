// @flow
import Promise from 'any-promise'
import {FileSystemError} from './errors'

class BlankFileSystem {
  readTemplateFile (templatePath: string) {
    return Promise.reject(new FileSystemError("This file system doesn't allow includes"))
  }
}

export default BlankFileSystem
