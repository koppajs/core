import utils from './utils';
import instance from './instance';
import component from './component';
import mediator from './mediator';
import transformer from './transformer';
import watcher from './watcher';

const module = (() => {
  const modules = {};

  return new Proxy(modules, {
    has: (target, property) => {
      if (target[property]) {
        window.console.error('property not in target');
        return false;
      }
      return true;
    },
    get: async (target, property) => target[property],
    set: async (target, property, value) => {
      const $ = {
        getId: utils.getId,
        getIdent: utils.getIdent,
        defineTrigger: utils.defineTrigger,
        addExtension: utils.addExtension,
        dataTypes: utils.dataTypes,
        mediator,
        transformer,
        take: utils.take,
        module: modules,
        instance,
        component,
        watcher
      };

      const currentModule = value.isAsync ? await value($) : value($);
      if (currentModule?.isObject) Reflect.set(target, property, currentModule);

      return value;
    }
  });
})();

export default module;
