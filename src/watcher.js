import { dataTypes } from './types';

const watcher = (() => {
  const obj = {
    target: {},
    handler: {},
    refs: {}
  };

  function dataWatchHandler(propName, oldVal, newVal) {
    if (oldVal !== newVal) {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        this.reConnect();
      }, 2);

      return newVal;
    }

    return oldVal;
  }

  function externalWatchHandler(propName, oldVal, newVal) {
    if (oldVal !== newVal) {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        Object.values(this).forEach((ref) => {
          ref.reConnect();
        });
      }, 2);

      return newVal;
    }

    return oldVal;
  }

  function add() {
    this.watching.forEach((item) => {
      if (item.getType === dataTypes.string) {
        if (item.startsWith('$')) { // store watchings
          Object.keys(obj.target).forEach((targetItem) => {
            if (item.startsWith(targetItem)) {
              if (!obj.refs[targetItem]) obj.refs[targetItem] = [];
              if (!obj.refs[targetItem].includes(this)) obj.refs[targetItem].push(this);
              const itemArray = item.replace(`${targetItem}.`, '').split('.');
              if (itemArray.length === 1) {
                obj.target[targetItem].watch(itemArray[0], externalWatchHandler.bind(obj.refs[targetItem]));
              } else {
                const itemKey = itemArray.pop();
                Object.byString(obj.target[targetItem], itemArray.join('.'))
                  .watch(itemKey, externalWatchHandler.bind(obj.refs[targetItem]));
              }
            }
          });
        } else {
          const itemArray = item.split('.');
          if (itemArray.length === 1) { // data
            this.data.watch(itemArray[0], dataWatchHandler.bind(this));
          } else { // deep nested in data
            const itemKey = itemArray.pop();
            Object.byString(this.data, itemArray.join('.')).watch(itemKey, dataWatchHandler.bind(this));
          }
        }
      }
    });
  }

  function createTarget() {
    [obj.target[`$.${this[0]}`]] = [this[1]];
  }

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
        add.call(value);
        break;
      case 'createTarget':
        createTarget.call(value);
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
