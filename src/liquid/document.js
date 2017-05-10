import {Block} from './block'

class Document extends Block {
  /* we don't need markup to open this block */
  constructor (template) {
    super(template)
    this.template = template
  }
  /**
   * There isn't a real delimiter
   * @return []
   */
  blockDelimiter () {
    return []
  }
  /**
   * Document blocks don't need to be terminated since they are not actually
   * opened
   */
  assertMissingDelimitation () {}
}
export { Document }
