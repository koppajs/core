function store() {
  const state = {};

  const storage = (bindStorage) => {
    const set = (key, value) => (key && value ? bindStorage.setItem(key, JSON.stringify(value)) : null);
    const exists = (key) => (!!(key && bindStorage.getItem(key)));
    const get = (key) => (key && exists(key) ? JSON.parse(bindStorage.getItem(key)) : null);
    const remove = (key) => (!!(key && bindStorage.removeItem(key)));
    const length = () => bindStorage.length;

    const clear = () => {
      bindStorage.clear();
      return !!bindStorage.length;
    };

    return {
      set,
      get,
      exists,
      remove,
      clear,
      length
    };
  };

  // create new watch target
  this.watcher.createTarget('store.state', state);

  return {
    local: storage(localStorage),
    session: storage(sessionStorage),
    state
  };
}

export default store;
