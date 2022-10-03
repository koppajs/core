import utils from './utils';
import instance from './instance';
import component from './component';
import mediator from './mediator';
import transformer from './transformer';
import watcher from './watcher';

const module = (() => {
  const modules = {};

  return new Proxy(modules, {
    get: (target, property) => target[property],
    set: async (target, property, value) => {
     const currentModule = utils.frun(value, {
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
      });

      if (currentModule?.isObject)
        target[property] = currentModule;

      return value;
    }
  });
})();

export default module;
