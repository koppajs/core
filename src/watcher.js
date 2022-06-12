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
      const playTimeout = (refIdentifier) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          refs[refIdentifier]?.forEach((item) => {
            item.reConnect();
          });
        }, 2);
      };

      let refIdentifier = this;
      while (refIdentifier !== '$') {
        playTimeout(refIdentifier);
        refIdentifier = refIdentifier.substr(0, refIdentifier.lastIndexOf('.'));
      }

      return newVal;
    }

    return oldVal;
  }

  function findTarget(searchStrg) {
    return Object.keys(target).filter((item) => searchStrg.startsWith(item))[0];
  }

  function addWatchRef(newRef, instance) {
    if (!refs[newRef]) refs[newRef] = [];
    if (!refs[newRef]?.includes(instance)) refs[newRef]?.push(instance);
  }

  function add(instance) {
    instance.watching.forEach((item) => {
      if (item.getType === dataTypes.string) {
        if (item.startsWith('$')) { // external watchings
          const curTargetObjPath = findTarget(item);
          const curTargetObj = target[findTarget(item)];
          const curItemPath = item.replace(new RegExp(`^\\${curTargetObjPath}.?`), '');
          const curItemPathArray = curItemPath.split('.');
          const curItemName = curItemPathArray.pop();
          const curParentItemPath = curItemPathArray.join('.');

          addWatchRef(`${curTargetObjPath}${curItemPath ? `.${curItemPath}` : ''}`, instance);

          if (curItemPath) {
            if (curParentItemPath) { // items thath deeper nested as one lvl
              Object.byString(curTargetObj, curParentItemPath)
                .watch(curItemName, externalWatchHandler.bind(item));
            } else { // items in first nested lvl
              curTargetObj.watch(curItemName, externalWatchHandler.bind(item));
            }
          }
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

  const createTarget = (path, obj) => {
    target[`$.${path}`] = obj;
    return obj;
  };

  return {
    add,
    createTarget
  };
})();

export default watcher;
