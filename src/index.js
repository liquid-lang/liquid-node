// @flow
import Engine from './liquid/engine';
import * as Helpers from './liquid/helpers';

import {
    ArgumentError,
    ContextError,
    Error,
    FileSystemError,
    FilterNotFound,
    StackLevelError,
    StandardError,
    SyntaxError,
} from './liquid/errors';
import {
  Assign,
  Capture,
  Case,
  Comment,
  Decrement,
  For,
  If,
  Ifchanged,
  Include,
  Increment,
  Raw,
  Unless,
} from './liquid/tags';


import Range from './liquid/range';
import Iterable, { IterableForArray } from './liquid/iterable';

import Drop from './liquid/drop';
import Context from './liquid/context';
import Tag from './liquid/tag';
import Block from './liquid/block';
import Document from './liquid/document';
import Variable from './liquid/variable';
import Template from './liquid/template';
import StandardFilters from './liquid/standard_filters';
import Condition from './liquid/condition';
import ElseCondition from './liquid/else_condition';
import BlankFileSystem from './liquid/blank_file_system';
import LocalFileSystem from './liquid/local_file_system';

const Liquid = Object.assign({},  {
  ArgumentError,
  Assign,
  BlankFileSystem,
  Block,
  Capture,
  Case,
  Comment,
  Condition,
  Context,
  ContextError,
  Decrement,
  Document,
  Drop,
  ElseCondition,
  Engine,
  Error,
  FileSystemError,
  FilterNotFound,
  For,
  Helpers,
  If,
  Ifchanged,
  Include,
  Increment,
  Iterable,
  IterableForArray,
  LocalFileSystem,
  Range,
  Raw,
  StackLevelError,
  StandardError,
  StandardFilters,
  SyntaxError,
  Tag,
  Template,
  Unless,
  Variable,
});

export default Liquid;
