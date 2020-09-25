export default function store(that) {
  let dataStore;

  /* sessionStorage & localStorage */
  let methods = (storage) => {
    return {
      set: function(key, value) {
          if(!key || !value) return;
          storage.setItem(key, JSON.stringify(value));
      },
      get: function(key) {
          if(!key) return;
          if(this.exists(key))
              return JSON.parse(storage.getItem(key));
          return null;
      },
      add: function(key, value) {
          if(!key || !value) return;
          if(this.exists(key))
              value = JSON.parse(this.get(key))+value;
          storage.setItem(key, JSON.stringify(value));
          return value;
      },
      exists: function(key) { // return boolean of exist
          if(!key) return false;
          if(!storage.getItem(key)) return false;
          return true;
      },
      remove: function(key) {
          if(!key) return;
          if(storage.removeItem(key)) return false;
          return true;
      },
      clear: function() {
          storage.clear();
          if(storage.length) return false;
          return true;
      },
      length: function() {
          return storage.length;
      }
    };
  };

  dataStore = {
    local: methods(localStorage),
    session: methods(sessionStorage),
    global: {},
    data: {}
  };

  that.addBefore(() => { dataStore.data = {}; });
  that.scope.store = dataStore;

  return {
    local: methods(localStorage),
    session: methods(sessionStorage)
  };
}
