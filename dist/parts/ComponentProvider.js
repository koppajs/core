export default function componentProvider(that) {
  let componentStore = that.settings.components || {};

  let add = (name, path) => componentStore[name] = path;

  let get = name => {
    if(componentStore[name]) {
      return componentStore[name];
    } else {
      console.log(`Component route for ${name} not exists`);
      return name;
    }
  };

  let names = () => Object.keys(componentStore);

  return {
    get,
    add,
    names
  }
}
