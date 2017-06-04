/**
 * A drop in liquid is a class which allows you to to export DOM
 * like things to liquid.
 * Methods of drops are callable.
 * The main use for liquid drops is the implement lazy loaded objects.
 * If you would like to make data available to the web designers
 * which you don't want loaded unless needed then a drop is a great
 * way to do that
 *
 * Example:
 *
 *    class ProductDrop extends Liquid.Drop {
 *      topSales () {
 *        return Shop.current.products.all({
 *          order: 'sales',
 *          limit: 10
 *        })
 *      }
 *    }
 *
 *    tmpl = Liquid.Template.parse('{% for product in product.top_sales %}\n  {{ product.name }}\n{%endfor%}')
 *
 *    tmpl.render({ product: new ProductDrop() }) // will invoke topSales query.
 *
 * Your drop can either implement the methods sans any parameters or implement the
 * beforeMethod(method) method which is a catch-all
 */
class Drop {
  context = null

  beforeMethod(method) {}

  get(methodOrKey) {
    return this.invokeDrop(methodOrKey);
  }
  hasKey(key) {
    return true;
  }
  has(key) {
    this.hasKey(key);
  }
  invokeDrop(methodOrKey) {
    if (this.constructor.isInvokable(methodOrKey)) {
      const value = this[methodOrKey];
      if (typeof value === 'function') {
        return value.call(this);
      }
      return value;
    }
    return this.beforeMethod(methodOrKey);
  }
  static isInvokable(method) {
    const self = this;
    if (!this.invokableMethods) {
      this.invokableMethods = (() => {
        const blacklist = Object.keys(Drop.prototype);
        const whitelist = ['toLiquid'];
        Object.keys(self.prototype).forEach((k) => {
          if (!blacklist.includes(k)) {
            whitelist.push(k);
          }
        });
        return whitelist;
      })();
    }
    return this.invokableMethods.includes(method);
  }
  toLiquid() { return this; }
  toString() { return `[Liquid.Drop ${this.constructor.name}]`; }
}

export default Drop;
