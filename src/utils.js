import binder from './binder';
import module from './module';
import component from './component';
import { dataTypes } from './types';

const utils = (() => {
  const usedIds = [];
  const customEvents = {};
  const triggers = {};
  const extensions = {}; // script Extensions

  const getId = () => { // generate custom id
    const max = 99999999;
    const id = Math.floor(Math.random() * max);

    if (usedIds.includes(id)) {
      return getId();
    } else {
      usedIds.push(id);
      return id;
    }
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
    if (c[0] === ':') return `{{${c.substr(1)}}}`;

    let ret = eval(`try { data.${c} } catch { 'undefined' }`);

    if (ret?.isFunction) ret = ret.call(data);
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

  /**
   * Creates Modules, Components on different ways
   *
   * @param arg1
   * @param arg2
   * @returns {Promise<void>}
   */
  const take = async (arg1, arg2) => {
    if (arg1.isFunction) { // module
      module[arg1.name] = arg1;
    } else if (arg2.match(/^\.\/[a-z0-9_@\-^!#$%&+={}./\\[\]]+\.html/)) { // html file
      const response = await module.fetcher.get(arg2);
      component[arg1] = response.content;
    } else { // component
      component[arg1] = arg2;
    }
  };

  const addExtension = (name, type) => {
    extensions[name] = type;
  };

  const buildExtensions = (script, data) => {
    const builded = {};

    Object.entries(extensions).forEach(([key, value]) => {
      if (script[key]) {
        switch (value) {
          case dataTypes.function:
            builded[key] = script[key].bind(data);
            break;
          default:
            builded[key] = script[key];
            break;
        }
      }
    });

    return builded;
  };

  return {
    getId,
    getIdent,
    replaceData,
    buildTrigger,
    binder,
    createTrigger,
    take,
    addExtension,
    buildExtensions,
    dataTypes
  };
})();

export default utils;
