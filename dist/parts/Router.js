export default function router(that) {
  let popStateEvent = new PopStateEvent('popstate', null);
  let settings = that.settings.router,
      routes = [];

  let add = function(re = '', handler) {
    if(re.isFunction) { handler = re; re = ''; }
    re = that.clearSlashes(re);
    re && (re = new RegExp(re));
    routes.push({ re, handler});
  };

  let getFragment = function() {
    return that.clearSlashes(decodeURI(location.pathname));
  };

  for(let i in settings.routes) {
    add(i, function() { return settings.routes[i].file; });
  }

  let ret = {
    remove: function(param) {
      for(let i = 0, r; i < routes.length, r = routes[i]; i++) {
          if(r.handler === param || r.re.toString() === param.toString()) {
              routes.splice(i, 1);
              return this;
          }
      }
      return this;
    },
    check: async function(fragment = getFragment()) {
      for(let i = 0; i < routes.length; i++) {
        let match = fragment.match(routes[i].re);

        if(match && routes[i].re !== '' || match && fragment === '') {
            let result = routes[i].handler.call({}, match.shift());
            result && await that.renderer.digest(result);
            return this;
        }
      }

      // not found 404-Page
      await that.renderer.digest(settings.errorPages['404']);
      return this;
    },
    listen: async function() {
      let self = this;
      let current = getFragment();
      let fn = async function() {
          if(current !== getFragment()) {
              current = getFragment();
              await self.check(current);
          }
      }

      window.addEventListener('popstate', fn, true);

      return this;
    },
    navigate: function(path = '', replace) {
      if(replace) {
        history.replaceState(null, null, that.clearSlashes(path));
      } else {
        history.pushState(null, null, that.clearSlashes(path));
      }

      dispatchEvent(popStateEvent);
      return this;
    }
  };

  that.scope.navigate = ret.navigate;

  return ret;
}
