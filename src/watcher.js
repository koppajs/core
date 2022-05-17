import { dataTypes } from './types';

const watcher = (() => {
  const target = {};
  const refs = {};

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
        Object.values(this).forEach((item) => {
          item.reConnect();
        });
      }, 2);

      return newVal;
    }

    return oldVal;
  }

  function add(instance) {
    instance.watching.forEach((item) => {
      if (item.getType === dataTypes.string) {
        if (item.startsWith('$')) { // external watchings
          Object.keys(target).forEach((targetItem) => {
            if (item.startsWith(targetItem)) {
              if (!refs[targetItem]) refs[targetItem] = [];
              const innerItem = item.replace(`${targetItem}.`, '');
              if (!refs[targetItem][innerItem]) refs[targetItem][innerItem] = [];
              const innerRefs = refs[targetItem][innerItem];
              if (!innerRefs.includes(instance)) innerRefs.push(instance);
              const itemArray = innerItem.split('.');
              if (itemArray.length === 1) {
                target[targetItem].watch(itemArray[0], externalWatchHandler.bind(innerRefs));
              } else {
                const itemKey = itemArray.pop();
                Object.byString(target[targetItem], itemArray.join('.'))
                  .watch(itemKey, externalWatchHandler.bind(innerRefs));
              }
            }
          });
        } else {
          const itemArray = item.split('.');
          if (itemArray.length === 1) { // data
            instance.data.watch(itemArray[0], dataWatchHandler.bind(instance));
          } else { // deep nested in data
            const itemKey = itemArray.pop();
            Object.byString(instance.data, itemArray.join('.')).watch(itemKey, dataWatchHandler.bind(instance));
          }
        }
      }
    });
  }

  function createTarget(newTarget) {
    [target[`$.${newTarget[0]}`]] = [newTarget[1]];
  }

  return {
    add,
    createTarget
  }
})();

export default watcher;
