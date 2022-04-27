const router = ($) => {
  const routes = [];
  let currentRoute = null;

  const popStateEvent = new Event('popstate', null);

  const { protocol } = window.location;
  const { hostname } = window.location;
  const { port } = window.location;

  const basePath = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  // remove slasches on bstart and end of string
  const clearSlashes = (val) => val.toString()
    .replace(/\/+/g, '/')
    .replace(/((\/$)|(^\/)|(^\.\.\/)|(^\.\/))/g, '')
    .replace(/http:\/+/g, 'http://')
    .replace(/https:\/+/g, 'https://');

  const urlBuilder = (parts) => {
    let url = '';

    parts.forEach((item) => {
      url += `${url === '' ? '' : '/'}${clearSlashes(item)}`;
    });

    return url;
  };

  const findRoute = () => {
    let ret = false;
    if (!routes.length) return ret;

    const pathname = clearSlashes(window.location.pathname);
    const pathnameParts = pathname.split('/');

    routes.forEach((route) => {
      route.params = {};
      const pathParts = route.path.split('/');

      if (JSON.stringify(pathnameParts) === JSON.stringify(pathParts)) {
        pathParts.forEach((value, index) => {
          if (value.charAt(0) === ':') {
            const valueParts = value.slice(1, value.length - 1).split('<');
            const pattern = new RegExp(valueParts[1], 'g');
            if (pattern.test(pathnameParts[index])) {
              route.params[valueParts[0]] = pathnameParts[index];
            }
          }

          if (index === pathParts.length - 1) {
            ret = route;
          }
        });
      }
    });

    return ret;
  };

  // routingHandler manage the content change inside the router view and component refinding
  async function routingHandler(instance) {
    const route = findRoute();
    let currentComponent = true;

    if (route) {
      if (!window.history.state || window.history.state.middleware !== false) {
        currentComponent = instance.data[instance.data.$obj].middleware
          ? await instance.data[instance.data.$obj].middleware(route)
          : true;
      }

      if (currentComponent === true) {
        currentComponent = route.handler ? await route.handler(route.params) : true;
      }

      if (currentComponent === true) {
        currentComponent = route.component;
      }

      if (currentComponent === false) {
        currentComponent = 'error-404';
      }

      if (currentComponent.isString) {
        if ($.component[currentComponent] === undefined) {
          currentComponent = 'error-404';
          this.html(`<${currentComponent}></${currentComponent}>`);
        } else {
          this.html(`<${currentComponent}></${currentComponent}>`);
        }
      }
    } else {
      currentComponent = 'error-404';
      this.html(`<${currentComponent}></${currentComponent}>`);
    }
    currentRoute = route;
  }

  function setListener(instance) {
    window.addEventListener('popstate', async () => {
      await routingHandler.call(this, instance);
    }, true);
  }

  const add = (route) => {
    let isAdded = false;
    route.path = clearSlashes(route.path);

    routes.forEach((item) => {
      isAdded = item.path === route.path;
    });

    if (!isAdded) {
      route.params = {};
      routes.push(route);
    }
  };

  const grabRoutes = (grabbedRoutes) => grabbedRoutes.forEach((item) => {
    if (item.handler) item.handler = item.handler.bind(item);
    add(item);
  });

  const push = (path = '', state = {}) => {
    window.renderCounter = 0;
    window.history.pushState(state, null, urlBuilder([basePath, path]));
    dispatchEvent(popStateEvent);
  };

  const replace = (path = '', state = {}) => {
    window.renderCounter = 0;
    window.history.replaceState(state, null, urlBuilder([basePath, path]));
    dispatchEvent(popStateEvent);
  };

  const getParams = () => currentRoute.params;

  $.mediator.add('connected', async (node) => {
    if (node.localName === 'router-view') {
      const instance = $.instance[node.instanceId];

      setListener.call(node, instance);
      if (instance.data.$obj) {
        grabRoutes(instance.data[instance.data.$obj].routes);
        await routingHandler.call(node, instance); // first run
      }
    }
  });

  $.mediator.add('after', () => {
    document.querySelectorAll('[push]').forEach((node) => {
      node.attr('href', node.attr('push'));
      node.removeAttribute('push');
      node.addEventListener('click', (event) => {
        event.preventDefault();
        push(event.target.closest('[href]').attr('href'));
      });
    });
  });

  $.take('router-view', '<template></template><script></script><style></style>');

  return {
    add,
    push,
    replace,
    getParams,
    basePath,
    clearSlashes,
    urlBuilder
  };
};

export default router;
