/* eslint func-names: 0 */

const binder = function (_____, ____) { // declarations, script
  return eval(`((${Object.keys(_____).map((item) => `${item} = _____.${item}`).join(', ')}) => {
    let koppa, binder, item, _____, ____; return ${____};
  })();`);
};

export default binder;
