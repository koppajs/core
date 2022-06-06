import './prototype-extensions';

import utils from './utils';
import module from './module';
import transformer from './transformer';
import mediator from './mediator';
import instance from './instance';
import component from './component';
import head from './head';

import watcher from './watcher';

import fetcher from './fetcher';
import store from './store';
import router from './router';

export default (() => {
  let mutate = false;

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach(() => {
      // run it once
      if (!mutate) {
        const timeout0 = setTimeout(async () => {
          clearTimeout(timeout0);
          await mediator.run('after');
        }, 50);

        const timeout1 = setTimeout(() => {
          clearTimeout(timeout1);
          mutate = false;
        }, 100);

        mutate = true;
      }
    });
  });

  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      const timeout = setTimeout(async () => {
        clearTimeout(timeout);
        await mediator.run('after');
        observer.observe(document.querySelector('body'), { subtree: true, childList: true });
      }, 200);
    }
  };

  const take = async (arg1, arg2) => { // take module or component
    if (arg1.isFunction) { // module
      const moduleArgs = {
        utils: {
          getId: utils.getId,
          getIdent: utils.getIdent,
          createTrigger: utils.createTrigger
        },
        module,
        transformer,
        mediator,
        instance,
        component,
        head,
        watcher,
        take
      };

      const currentModule = arg1.isAsync ? await arg1(moduleArgs) : arg1(moduleArgs);
      if (currentModule?.isObject) module[arg1.name] = currentModule;
    } else if (arg2.match(/^\.\/[a-z0-9_@\-^!#$%&+={}./\\[\]]+\.html/)) { // html file
      const response = await module.fetcher.get(arg2);
      component[arg1] = response.content;
    } else { // component
      component[arg1] = arg2;
    }
  };

  take(fetcher);
  take(store);
  take(router);

  const core = (componentName) => document.body.prepend(`<${componentName}></${componentName}>`);

  core.take = take;

  return core;
})();
