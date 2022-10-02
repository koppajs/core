function router() {
  const routes = [];
  let currentRoute = null;

  const popStateEvent = new Event('popstate', null);

  const { protocol } = window.location;
  const { hostname } = window.location;
  const { port } = window.location;

  const basePath = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  // node Header Template
  const headerTemplates = {
    charset: '<meta charset="utf-8"/>',
    title: '<title>{{content}}</title>',
    description: '<meta name="description" content="{{content}}"/>',
    keywords: '<meta name="keywords" content="{{content}}"/>',
    author: '<meta name="author" content="{{content}}"/>',
    copyright: '<meta name="copyright" content="{{content}}"/>',
    robots: '<meta name="robots" content="{{content}}"/>',
    'cache-control': '<meta http-equiv="cache-control" content="{{content}}"/>',
    expires: '<meta http-equiv="expires" content="{{content}}"/>',
    refresh: '<meta http-equiv="refresh" content="{{content}}"/>'
  };

  // find nodes in DOM
  const headerNodes = {
    refresh: document.head.querySelector('meta[http-equiv="refresh"]'),
    expires: document.head.querySelector('meta[http-equiv="expires"]'),
    'cache-control': document.head.querySelector('meta[http-equiv="cache-control"]'),
    robots: document.head.querySelector('meta[name="robots"]'),
    copyright: document.head.querySelector('meta[name="copyright"]'),
    author: document.head.querySelector('meta[name="author"]'),
    keywords: document.head.querySelector('meta[name="keywords"]'),
    description: document.head.querySelector('meta[name="description"]'),
    title: document.head.querySelector('title'),
    charset: document.head.querySelector('meta[charset]')
  };

  // sort nodes in DOM
  Object.keys(headerNodes).forEach((item) => {
    if (headerNodes[item] !== null) {
      document.head.prepend(headerNodes[item]);
    }
  });

  const defaultHeaderContent = {
    charset: headerNodes.charset?.attr('charset'),
    title: headerNodes.title?.innerHTML || '>&#8205;',
    description: headerNodes.description?.attr('content'),
    keywords: headerNodes.keywords?.attr('content'),
    author: headerNodes.author?.attr('content'),
    copyright: headerNodes.copyright?.attr('content'),
    robots: headerNodes.robots?.attr('content'),
    'cache-control': headerNodes['cache-control']?.attr('content'),
    expires: headerNodes.expires?.attr('content'),
    refresh: headerNodes.refresh?.attr('content')
  };

  let oldHeaderContent = { ...defaultHeaderContent };
  let currentHeaderContent = { ...defaultHeaderContent };

  const setHeader = (obj) => {
    oldHeaderContent = currentHeaderContent;
    currentHeaderContent = {};

    Object.keys(headerNodes).forEach((item) => {
      if (obj[item] !== undefined && obj[item] === false) {
        currentHeaderContent[item] = obj[item] || defaultHeaderContent[item] || false;
      } else {
        currentHeaderContent[item] = obj[item] || oldHeaderContent[item] || defaultHeaderContent[item] || false;
      }
    });

    Object.keys(headerNodes).forEach((item) => {
      if (currentHeaderContent[item] === false) { // remove
        headerNodes[item]?.remove();
      } else if (currentHeaderContent[item] !== false && headerNodes[item] === null) { // create
        headerNodes[item] = document.createHTML(headerTemplates[item].replace(
          /{{content}}/,
          currentHeaderContent[item]
        ));
      } else { // update
        if (item !== 'title' && item !== 'charset') {
          headerNodes[item].attr('content', currentHeaderContent[item]);
        } else if (item === 'charset') {
          headerNodes[item].attr('charset', currentHeaderContent[item]);
        } else if (item === 'title') {
          headerNodes[item].innerHTML = currentHeaderContent[item];
        }
      }
    });

    currentHeaderContent = Object.fromEntries(Object.entries(currentHeaderContent).filter(([, val]) => val !== false));
  };

  const getHeader = () => currentHeaderContent;

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
  const routingHandler = async (node, instance) => {
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
        if (this.component[currentComponent] === undefined) {
          currentComponent = 'error-404';
          node.html(`<${currentComponent}></${currentComponent}>`);
        } else {
          node.html(`<${currentComponent}></${currentComponent}>`);
        }
      }
    } else {
      currentComponent = 'error-404';
      this.html(`<${currentComponent}></${currentComponent}>`);
    }
    
  	currentRoute = route;
  	
  }

  const setListener = (node, instance) => {
    window.addEventListener('popstate', async () => {
      await routingHandler(node, instance);
    }, true);
  };

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

  this.mediator.add('connected', async (node) => {
    const instance = this.instance[node.instanceId];

    if (node.localName === 'router-view') {
      setListener(node, instance);
      if (instance.data.$obj) {
        grabRoutes(instance.data[instance.data.$obj].routes);
        await routingHandler(node, instance); // first run
      }
    }

    if (instance.head) {
      setHeader(instance.head);
    }
  });

  this.mediator.add('after', () => {
    document.querySelectorAll('[push]').forEach((node) => {
      node.attr('href', node.attr('push'));
      node.removeAttribute('push');
      node.addEventListener('click', (event) => {
        event.preventDefault();
        push(event.target.closest('[href]').attr('href'));
      });
    });
  });

  this.addExtension('head', this.dataTypes.object);

  this.take('router-view', '<template></template><script></script><style></style>');

  return {
    add,
    push,
    replace,
    getParams,
    basePath,
    clearSlashes,
    urlBuilder,
    getHeader
  };
}

export default router;
