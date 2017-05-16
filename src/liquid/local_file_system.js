// @flow
import Promise from 'any-promise'
import path from 'path'
import fs from 'fs'

import {ArgumentError, FileSystemError} from './errors'
import BlankFileSystem from './blank_file_system'

const readFile = (fpath: string, encoding: string) => new Promise(function (resolve, reject) {
  fs.readFile(fpath, encoding, (err, content) => {
    if (err) {
      return reject(err)
    }
    return resolve(content)
  })
})

const PathPattern = /^[^./][a-zA-Z0-9-_/]+$/

class LocalFileSystem extends BlankFileSystem {
  root: string
  fileExtension: string
  constructor (root: string, extension: string = 'html') {
    super()
    this.root = root
    this.fileExtension = extension
  }

  readTemplateFile (templatePath: string) {
    return this.fullPath(templatePath)
            .then(fullPath => readFile(fullPath, 'utf8'))
            .catch(err => { throw new FileSystemError(`Error loading template: ${err.message}`) })
  }

  fullPath (templatePath: string) {
    if (PathPattern.test(templatePath)) {
      return Promise.resolve(path.resolve(path.join(this.root, `${templatePath}.${this.fileExtension}`)))
    }
    return Promise.reject(new ArgumentError(`Illegal template name '${templatePath}'`))
  }
}
export default LocalFileSystem
