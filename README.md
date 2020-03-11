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
- Supports [whitespace control](https://shopify.github.io/liquid/basics/whitespace/)
- Allows custom tags and filters to be added
- Supports full liquid syntax
- Based on original Ruby code
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

```sh
npm install liquid
```

## Usage

Liquid supports a very simple API based around the Liquid.Engine class.
For standard use you can just pass it the content of a file and call render with an object.

```js
const Liquid = require('liquid')
const engine = new Liquid.Engine()

engine
  .parse('hi {{name}}')
  .then(template => template.render({ name: 'tobi' }))
  .then(result => console.log(result))

// or

engine
  .parseAndRender('hi {{name}}', { name: 'tobi' })
  .then(result => console.log(result))
```

### Usage with Connect

```js
app.get((req, res, next) => {
  engine
    .parseAndRender('hi {{name}}', { name: 'tobi' })
    .nodeify((err, result) => {
      if (err) {
        res.end('ERROR: ' + err)
      } else {
        res.end(result)
      }
    })
})
```

### Registering new filters

```javascript
engine.registerFilters({
  myFilter: input => {
    return String(input).toUpperCase()
  }
})
```

### Registering new tags

Take a look at the [existing tags](https://github.com/sirlantis/liquid-node/tree/master/lib/liquid/tags)
to see how to implement them.

```js
class MyTag extends Liquid.Tag {
  render () {
    return 'hello world'
  }
}

engine.registerTag('MyTag', MyTag)
```

## Tests

```sh
npm test
```

## Similar libraries

* [harttle/liquidjs](https://github.com/harttle/liquidjs) (`liquidjs` on npm) is another actively maintained Liquid parser and render for Node.js
* [darthapo's Liquid.js](https://github.com/darthapo/liquid.js) is liquid ported to JavaScript to be run within the browser. It doesn't handle asynchrony.
* [tchype's Liquid.js](https://github.com/tchype/liquid.js) is `liquid-node` wrapped to run in a browser.

## License

[MIT](http://www.opensource.org/licenses/MIT)
