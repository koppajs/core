import './prototype-extensions';

import utils from './utils';
import mediator from './mediator';

import fetcher from './fetcher';
import store from './store';
import router from './router';

export default (() => {
  let mutate = false;

  /**
   * Observer to run mediator after html change
   *
   * @type {MutationObserver}
   */
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

  /**
   * Run mediator after document is finish loaded and rendered
   */
  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      const timeout = setTimeout(async () => {
        clearTimeout(timeout);
        await mediator.run('after');
        observer.observe(document.body, { subtree: true, childList: true });
      }, 200);
    }
  };

  // take the standard modules
  utils.take(fetcher);
  utils.take(store);
  utils.take(router);

  // create app container element
  const core = (componentName) => document.body.prepend(`<${componentName}></${componentName}>`);

  // add take to make it available from the outside
  core.take = utils.take;

  return core;
})();
