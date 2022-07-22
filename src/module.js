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
      target[property] = value;

      let currentModule = value.bind({
        getId: utils.getId,
        getIdent: utils.getIdent,
        createTrigger: utils.createTrigger,
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

      currentModule = currentModule.isAsync ? await currentModule() : currentModule();
      if (currentModule?.isObject) target[property] = currentModule;

      return value;
    }
  });
})();

export default module;
