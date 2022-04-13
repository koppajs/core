import binder from './binder';

/* eslint no-eval: 0 */

const utils = (() => {
  const usedIds = [];
  const customEvents = {};
  const triggers = {};

  const getId = () => { // generate custom id
    const max = 99999999;
    const id = Math.floor(Math.random() * max);
    return usedIds.includes(id) ? getId() : id;
  };

  const getIdent = (ele) => {
    const ident = ele.dataset.instance?.split('|') || [getId(), null];
    const self = ident[0]?.toNumber;
    let parent = ident[1]?.toNumber;

    if (!parent) {
      const closestParent = ele.closest(`[data-instance]:not([data-instance="${ele.dataset.instance || ''}"])`);
      if (closestParent) parent = closestParent.dataset.instance.split('|')[0] || null;
    }

    ele.dataset.instance = `${self}${parent ? (`|${parent}`) : ''}`;
    ele.instanceId = self;

    return {
      self,
      parent
    };
  };

  const replaceData = (strg, data) => strg.replace(/\{\{([^{{}}]*)\}\}/g, (m, c) => {
    if (c[0] === ':') {
      return `{{${c.substr(1)}}}`;
    }
    const declarations = `const ${Object.keys(data).map((item) => `${item} = data['${item}']`).join('; const ')};`;
    let ret = eval(`try { ${declarations} ${c} } catch { 'undefined' }`);

    if (ret?.isFunction) ret = ret();
    else if (ret === null) ret = 'null';
    return ret;
  });

  const buildTrigger = (attr, delegator) => {
    const attrName = attr.name.substr(1);

    if (!customEvents[attrName]) customEvents[attrName] = new Event(attrName);
    const trigger = triggers[attrName];
    delegator.addEventListener(trigger?.type, () => {
      document.querySelector(trigger.target).dispatchEvent(customEvents[attrName]);
    });
  };

  const createTrigger = (name, type, target) => { // add a trigger set;
    triggers[name] = { type, target: target || 'body' };
  };

  return {
    getId,
    getIdent,
    replaceData,
    buildTrigger,
    binder,
    createTrigger
  };
})();

export default utils;
