export class Error extends global.Error {
  name = 'Liquid.Error'
  constructor(message) {
    super(message);
    this.message = message;
    if (global.Error.captureStackTrace) {
      global.Error.captureStackTrace(this, this.constructor);
    }
  }
}
export class ArgumentError extends Error {
  name = 'Liquid.ArgumentError'
}
export class ContextError extends Error {
  name = 'Liquid.ContextError'
}
export class FilterNotFound extends Error {
  name = 'Liquid.FilterNotFound'
}
export class FileSystemError extends Error {
  name = 'Liquid.FileSystemError'
}
export class StandardError extends Error {
  name = 'Liquid.StandardError'
}
export class StackLevelError extends Error {
  name = 'Liquid.StackLevelError'
}
export class SyntaxError extends Error {
  name = 'Liquid.SyntaxError'
}
