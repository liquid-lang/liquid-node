# Liquid with Node.js

[![NPM version](https://img.shields.io/npm/v/liquid-node.svg?style=flat)](https://www.npmjs.org/package/liquid-node)
[![Downloads](http://img.shields.io/npm/dm/liquid-node.svg?style=flat)](https://www.npmjs.org/package/liquid-node)
[![GitHub Issues](http://img.shields.io/github/issues/sirlantis/liquid-node.svg?style=flat)](https://github.com/sirlantis/liquid-node/issues)
<br>
[![Build Status](https://img.shields.io/travis/sirlantis/liquid-node.svg?style=flat)](https://travis-ci.org/sirlantis/liquid-node)
[![Coverage Status](https://img.shields.io/coveralls/sirlantis/liquid-node.svg?style=flat)](https://coveralls.io/r/sirlantis/liquid-node?branch=master)
[![Dependency Status](http://img.shields.io/david/sirlantis/liquid-node.svg?style=flat)](https://david-dm.org/sirlantis/liquid-node)
[![devDependency Status](http://img.shields.io/david/dev/sirlantis/liquid-node.svg?style=flat)](https://david-dm.org/sirlantis/liquid-node#info=devDependencies)

> LiquidNode is a port of the original Liquid template engine from *Ruby* to *Node.js*.
> It uses Promises to support non-blocking/asynchronous variables, filters, and blocks.

## Features

- Supports asynchronous variables, tags, functions and filters (helpers)
- Allows you to add custom tags and filters easily
- Supports full liquid syntax
- Based on original Ruby code
- Written in CoffeeScript
- High test coverage

## What does it look like?

```html
<ul id="products">
  {% for product in products %}
    <li>
      <h2>{{ product.name }}</h2>
      Only {{ product.price | price }}

      {{ product.description | prettyprint | paragraph }}
    </li>
  {% endfor %}
</ul>
```

## Installation

```
npm install liquid-node --save
```

## Usage

Liquid supports a very simple API based around the Liquid.Engine class.
For standard use you can just pass it the content of a file and call render with an object.

```javascript
Liquid = require("liquid-node")
var engine = new Liquid.Engine

engine
  .parse("hi {{name}}")
  .then(function(template) { return template.render({ name: "tobi" }); })
  .then(function(result) { console.log(result) });
  
// or

engine
  .parseAndRender("hi {{name}}", { name: "tobi" })
  .then(function(result) { console.log(result) });
```

### Usage with Connect

```javascript
app.get(function(req, res) {
  engine
    .parseAndRender("hi {{name}}", { name: "tobi" })
    .nodeify(function(err, result) {
      if (err) {
        res.end("ERROR: " + err);
      } else {
        res.end(result);
      }
    });
});
```

### Registration of new filters

```javascript
engine.registerFilters({
  myFilter: function(input) {
    return String(input).toUpperCase()
  }
});
```

### Registration of new Tags

Since the code is based on the Ruby implementation we use CoffeeScript's `class`
which is a little bit difficult to write in pure JavaScript.
Take a look at the [existing tags](https://github.com/sirlantis/liquid-node/tree/master/src/liquid/tags)
to see how to implement them.

```coffeescript
class MyTag extends Liquid.Tag
  render: ->
    "that's me!"
    
engine.registerTag "MyTag", MyTag
```

## How to run the tests

```
npm test
```

## Similar libraries

* [darthapo's Liquid.js](https://github.com/darthapo/liquid.js) is liquid ported to JavaScript to be run within the browser. It doesn't handle asynchrony.
* [tchype's Liquid.js](https://github.com/tchype/liquid.js) is `liquid-node` wrapped to run in a browser.

## License

LiquidNode is released under the [MIT license](http://www.opensource.org/licenses/MIT).
