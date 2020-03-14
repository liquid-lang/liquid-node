# Liquid with Node.js

This is a port of the original Liquid template engine from *Ruby* to *Node.js*. It uses Promises to support non-blocking/asynchronous variables, filters, and blocks.

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

### Usage with Connect and Express

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

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://twitter.com/sirlantis"><img src="https://avatars1.githubusercontent.com/u/56807?v=4" width="100px;" alt=""/><br /><sub><b>Marcel Jackwerth</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=sirlantis" title="Code">💻</a> <a href="https://github.com/docs/liquid/commits?author=sirlantis" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/tchype"><img src="https://avatars0.githubusercontent.com/u/236453?v=4" width="100px;" alt=""/><br /><sub><b>Tony C. Heupel</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=tchype" title="Code">💻</a></td>
    <td align="center"><a href="http://cyj.me/"><img src="https://avatars0.githubusercontent.com/u/252317?v=4" width="100px;" alt=""/><br /><sub><b>Chen Yangjian</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=cyjake" title="Code">💻</a></td>
    <td align="center"><a href="https://bergie.iki.fi/"><img src="https://avatars1.githubusercontent.com/u/3346?v=4" width="100px;" alt=""/><br /><sub><b>Henri Bergius</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=bergie" title="Code">💻</a></td>
    <td align="center"><a href="https://samtiffin.com"><img src="https://avatars2.githubusercontent.com/u/4738037?v=4" width="100px;" alt=""/><br /><sub><b>Sam Tiffin</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=samtiffin" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/kmctown"><img src="https://avatars0.githubusercontent.com/u/1482857?v=4" width="100px;" alt=""/><br /><sub><b>Kris Ciccarello</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=kmctown" title="Code">💻</a></td>
    <td align="center"><a href="http://www.swashcap.com/"><img src="https://avatars1.githubusercontent.com/u/1858316?v=4" width="100px;" alt=""/><br /><sub><b>Cory Reed</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=swashcap" title="Code">💻</a> <a href="#example-swashcap" title="Examples">💡</a> <a href="https://github.com/docs/liquid/commits?author=swashcap" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.sebastianseilund.com"><img src="https://avatars3.githubusercontent.com/u/744493?v=4" width="100px;" alt=""/><br /><sub><b>Sebastian Seilund</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=sebastianseilund" title="Code">💻</a></td>
    <td align="center"><a href="https://robloach.net"><img src="https://avatars1.githubusercontent.com/u/25086?v=4" width="100px;" alt=""/><br /><sub><b>Rob Loach</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=RobLoach" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sarahs"><img src="https://avatars3.githubusercontent.com/u/821071?v=4" width="100px;" alt=""/><br /><sub><b>Sarah Schneider</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=sarahs" title="Code">💻</a></td>
    <td align="center"><a href="http://zeke.sikelianos.com"><img src="https://avatars1.githubusercontent.com/u/2289?v=4" width="100px;" alt=""/><br /><sub><b>Zeke Sikelianos</b></sub></a><br /><a href="https://github.com/docs/liquid/commits?author=zeke" title="Code">💻</a> <a href="https://github.com/docs/liquid/commits?author=zeke" title="Documentation">📖</a> <a href="#maintenance-zeke" title="Maintenance">🚧</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!