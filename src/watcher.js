import { dataTypes, functionTypes, stringTypes } from './types';

const watcher = (() => {
  const obj = {};

  const dataWatchHandler = (propName, oldVal, newVal) => {
    if (oldVal !== newVal) {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        this.reConnect();
      }, 2);
    }
  };

  const handler = {
    get: (target, property) => {
      target[property] = (property in target) ? target[property] : {};

      if (typeof target[property] === 'object') {
        return new Proxy(target[property], handler);
      }

      return target[property];
    },
    set: async (target, property, value) => {
      switch (property) {
      case 'add':
        value.watching.forEach(function (item) {
          if (item.getType === dataTypes.string) { // data
            const itemArray = item.split('.');

            if (itemArray.length === 1) {
              this.data.watch(item, dataWatchHandler.bind(this));
            } else {
              const itemKey = itemArray.pop();

              Object.byString(this.data, itemArray.join('.')).watch(itemKey, dataWatchHandler.bind(this));
            }
          } else { // global watchings

          }
        }.bind(value));
        break;
      default:
        console.error(`property "${property}" of watcher not allowed`);
        break;
      }
    }
  };

  return new Proxy(obj, handler);
})();

export default watcher;
