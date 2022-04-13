const module = (() => {
  const modules = {};

  return new Proxy(modules, {
    get: (target, property) => target[property],
    set: async (target, property, value) => {
      target[property] = value;

      return true;
    }
  });
})();

export default module;
