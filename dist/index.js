import PrototypeExtensions from './libs/PrototypeExtensions.js';
import Caller from './parts/Caller.js';
import NodePlayer from './parts/NodePlayer.js';
import Renderer from './parts/Renderer.js';
import Replacer from './parts/Replacer.js';
import Router from './parts/Router.js';
import ComponentProvider from './parts/ComponentProvider.js';
import Store from './parts/Store.js';

export default async function core(options) {
  let that = {
    settings: options.settings || {}
  },

  config = {
    maxRequestTry: 24
  },

  usedIds = [], // list of used ids
  module = options.module || [],
  scrollbarSize;

  PrototypeExtensions(that);

  that.processes = {};
  that.beforeStack = [];
  that.afterStack = [];
  that.scope = {};
  that.stoped;

  that.getId = staticId => { // generate custom id
    let id = staticId ? staticId : Math.floor((Math.random() * (99999999 - 9999999)) + 9999999);

    if(!staticId && usedIds.includes(id)) {
      return that.getId();
    } else if(staticId && !usedIds.includes(id) || !staticId && !usedIds.includes(id)) {
      usedIds.push(id);
    }

    return id;
  };

  // returned translated strings based on the locale files
  that.t = name => that.replacer.interpreting(`${name}`);

  // remove slasches on bstart and end of string
  that.clearSlashes = path => path.toString().replace(/((\/$)|(^\/)|(^\.\.\/)|(^\.\/))/, '');

  that.urlBuilder = function() {
    let url = '';
    for(let i of arguments) {
      url += !url ? that.clearSlashes(i) : `/${that.clearSlashes(i)}`
    }
    return url;
  };

  that.getScrollbarSize = () => {
    if(scrollbarSize)
      return scrollbarSize;

    let outer, inner;

    // Creating invisible container
    outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    scrollbarSize = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarSize;
  };

  that.setLocale = newLocale => {
    let storedLocale = that.store.local.get('locale'),
        currentLocale = document.documentElement.getAttribute('lang') || 'en';

    if(newLocale) {
      that.store.local.set('locale', newLocale);
      document.documentElement.setAttribute('lang', newLocale);
    } else if(storedLocale) {
      document.documentElement.setAttribute('lang', storedLocale);
    } else {
      that.store.local.set('locale', currentLocale);
    }

    if(document.documentElement.getAttribute('lang') !== currentLocale) {
      navigate(location.href, true);
    }
  };

  that.getLocale = () => {
    return that.store.local.get('locale') || document.documentElement.getAttribute('lang') || 'en';
  };

  that.addStyle = async (path) => {
    let css = await that.caller.get(path);
    document.head.append(`<style>${that.replacer.interpreting(css.content)}</style>`);
  };

  that.addBefore = (f) => {
    that.beforeStack.push(f);
  };

  that.addAfter = (f) => {
    that.afterStack.push(f);
  };

  that.getLoader = () => {
    return `<div class="spinner">
                     <div class="bounce1"></div>
                     <div class="bounce2"></div>
                     <div class="bounce3"></div>
                   </div>`;
  };

  // add to the scope
  that.scope.setLocale = that.setLocale;
  that.scope.getLocale = that.getLocale;
  that.scope.getLoader = that.getLoader;
  that.scope.t = that.t;

  // create App Container
  that.appContainer = document.querySelector('#App');
  if(!that.appContainer) {
    document.body.append(`<div id="App"></div>`);
    that.appContainer = document.querySelector('#App');
  }

  // add JavaScript
  let loadScriptsAfter = () => {
    for(let src of that.settings.jsFiles) {
      let script = document.createElement("script");
      script.defer = true;
      script.src = src;
      document.head.append(script);
    }
  };

  if(window.addEventListener) {
    window.addEventListener("load", loadScriptsAfter);
  } else if(window.attachEvent) {
    window.attachEvent("onload", loadScriptsAfter);
  } else {
    window.onload = loadScriptsAfter;
  }

  that.caller = Caller(that, config);
  that.store = Store(that);
  that.router = Router(that);
  await that.router.listen();

  that.setLocale();

  that.replacer = await Replacer(that);
  that.nodePlayer = NodePlayer(that);
  that.componentProvider = ComponentProvider(that);
  that.renderer = Renderer(that);

  for(let cssFile of that.settings.cssFiles) {
    await that.addStyle(cssFile);
  }

  // load the modules
  for(let i of module) {
    i.isAsync ? await i(that) : i(that);
  }

  await that.router.check();
}
