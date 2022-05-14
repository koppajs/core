import { dataTypes, functionTypes, stringTypes } from './types';

const objectExtensions = {
  length: {
    get() {
      return Object.keys(this).length;
    }
  },
  isObject: {
    get() {
      return typeof this === 'object' && this !== null;
    }
  },
  isString: {
    get() {
      return typeof this === 'string' || this instanceof String;
    }
  },
  isBool: {
    get() {
      if (this.isString) {
        if (this.trim() === 'true' || this.trim() === '1' || this.trim() === 'false' || this.trim() === '0') {
          return true;
        }
      }
      if (this === true || this === 1 || this === false || this === 0) return true;
      return typeof this === 'boolean' || this instanceof Boolean;
    }
  },
  isJson: {
    get() {
      try { JSON.parse(this); } catch (e) { return false; } return true;
    }
  },
  isFunction: {
    get() {
      return !!(this && this.constructor && this.call && this.apply);
    }
  },
  isArrow: {
    get() {
      return typeof this === 'function' && (/^([^{=]+|\(.*\)\s*)?=>/).test(this.toString().replace(/\s/, ''));
    }
  },
  isAsync: {
    get() {
      return this[Symbol.toStringTag] === 'AsyncFunction';
    }
  },
  isNumber: {
    get() {
      if (typeof this === 'number' || (this.isString && this.match(/^[-+]?[0-9]*[,.]?[0-9]*$/g))) { return true; }
      return false;
    }
  },
  isElement: {
    get() {
      return (typeof HTMLElement === 'object'
        ? this instanceof HTMLElement
        : this && typeof this === 'object' && this !== null && this.nodeType === 1 && typeof this.nodeName === 'string'
      );
    }
  },
  toNumber: {
    get() {
      const self = Number(this) ? Number(this) : this.replace(/,/g, '.').replace(/^\./g, '0.').replace(/\.$/g, '.00');
      if (typeof self === 'number') return self;
      if (self.match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)) {
        return parseFloat(self);
      }
      return parseInt(self, 10);
    }
  },
  toBool: {
    get() {
      if (this.isBool) {
        if (this.isString) {
          if (this.trim() === 'true' || this.trim() === '1') return true;
          if (this.trim() === 'false' || this.trim() === '0') return false;
        }
        if (this === true || this === 1) return true;
        if (this === false || this === 0) return false;
        return !!this;
      }
      return false;
    }
  },

  getType: {
    get() {
      if (this.isString) return dataTypes.string;
      if (this.isBool) return dataTypes.bool;
      if (this.isFunction) return dataTypes.function;
      if (this.isNumber) return dataTypes.number;
      if (this.isElement) return dataTypes.element;
      if (Array.isArray(this)) return dataTypes.array;
      return dataTypes.object;
    }
  },

  getFunctionType: {
    get() {
      if (this.isArrow) return functionTypes.arrow;
      if (this.isAsync) return functionTypes.async;
      return functionTypes.normal;
    }
  },

  getStringType: {
    get() {
      if (this.isJson) return stringTypes.json;
      return stringTypes.normal;
    }
  },

  watch: {
    enumerable: false,
    configurable: true,
    writable: false,
    value(prop, handler) {
      let old; let cur;
      old = this[prop];
      cur = old;
      const getter = () => cur;
      const setter = (val) => {
        old = cur;
        cur = handler.call(this, prop, old, val);
        return cur;
      };

      // can't watch constants
      if (delete this[prop]) {
        Object.defineProperty(this, prop, {
          get: getter,
          set: setter,
          enumerable: true,
          configurable: true
        });
      }
    }
  },

  byString: {
    get() {
      return (obj, strg) => {
        let s = strg.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, ''); // strip a leading dot
        const a = s.split('.');
        let o = obj;

        for (let i = 0, n = a.length; i < n; i += 1) {
          const k = a[i];
          if (k in o) {
            o = o[k];
          } else {
            return undefined;
          }
        }

        return o;
      };
    }
  }
};

export default objectExtensions;
