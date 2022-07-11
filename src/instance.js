import utils from './utils';
import mediator from './mediator';
import module from './module';
import watcher from './watcher';
import { dataTypes } from './types';

const instance = (() => {
  const instances = {};
  let propChanging = false;

  function createInstanceTemplate(instanceId, templateContent) {
    const template = document.createElement('template');
    template.innerHTML = templateContent;

    const nodeList = template.content.getNodeList('element', (node) => node.localName.includes('-'));

    nodeList.forEach((item, index) => {
      nodeList[index].dataset.instance = `${utils.getId()}|${instanceId}`;
    });

    return template;
  }

  function buildProps(currentInstance) {
    const props = {};

    [...currentInstance.element.attributes].filter((attr) => attr.name.startsWith(':p')).forEach((item) => {
      const val = item.value.split('|');

      let propsName = `${val[0]}`;

      // it's an named object property
      if (val[0].match(/^\$_/)) {
        propsName = propsName.slice(2);
        props.$obj = propsName;
      }

      // it's a data property
      if (currentInstance.parent?.data[propsName] || currentInstance.parent?.data[propsName]?.isNumber) {
        // add to props
        props[propsName] = currentInstance.parent.data[propsName];
      } else { // it's a direct property string or number
        [props[propsName]] = [val[1] || true];
      }

      currentInstance.element.removeAttribute(item.name);
    });

    return props;
  }

  function buildChildProps(currentInstance) {
    const props = currentInstance?.props;
    const childProps = currentInstance?.parent?.childProps;

    Object.entries(props)?.forEach(([propKey]) => {
      if (childProps[currentInstance.id] === undefined) {
        childProps[currentInstance.id] = {};
      }

      childProps[currentInstance.id][propKey] = props[propKey];
    });
  }

  function firstOfPropChain(curInst, propName) {
    if (curInst.parent?.data[propName] !== undefined
      && curInst.parent?.childProps?.[curInst.id]?.[propName] !== undefined) {
      return firstOfPropChain(curInst.parent, propName);
    }

    return curInst;
  }

  function propWatchHandler(propName, oldVal, newVal) {
    // when its changed
    if (oldVal !== newVal) {
      // change parent
      if (this.parent.data[propName] !== newVal
        && this.parent?.childProps?.[this.id]?.[propName] !== newVal) {
        this.parent.childProps[this.id][propName] = newVal;
        this.parent.data[propName] = newVal;
      }

      // update childs
      Object.keys(this.childProps).forEach((item_) => {
        const item = item_;

        if (this.childProps[item][propName] !== newVal && instances[item].data[propName] !== newVal) {
          this.childProps[item][propName] = newVal;
          instances[item].data[propName] = newVal;
        }
      });

      // run it once
      if (!propChanging) {
        const timeout0 = setTimeout(() => {
          clearTimeout(timeout0);
          firstOfPropChain(this, propName).reConnect();
        }, 2);

        const timeout1 = setTimeout(() => {
          clearTimeout(timeout1);
          propChanging = false;
        }, 100);

        propChanging = true;
      }
    }

    // update current
    return newVal;
  }

  function createEventBindings(arr, data) {
    if (!arr) return null;
    const a = [];

    arr.forEach((item) => {
      if (item[2].isFunction) {
        a.push([item[0], item[1], item[2].bind(data)]);
      }
    });

    return a;
  }

  function buildEventListeners(currentInstance) {
    currentInstance.events.forEach((instanceEvent) => {
      const instanceEventSelector = instanceEvent[0];
      const instanceEventType = instanceEvent[1];
      const instanceEventHandler = instanceEvent[2];

      let selectors = [];
      let nodes = [];

      if (instanceEventSelector.isString) {
        selectors = instanceEventSelector.split(',');
      } else if (instanceEventSelector.isElement) {
        selectors.push(instanceEventSelector);
      } else if (Array.isArray(instanceEventSelector)) {
        selectors = instanceEventSelector;
      }

      selectors.forEach((selector) => {
        if (selector.isElement) {
          nodes.push(selector);
        } else {
          nodes = nodes.concat([...currentInstance.fragment.querySelectorAll(selector)]);
        }
      });

      nodes.forEach((node) => {
        node.addEventListener(
          instanceEventType,
          instanceEventHandler.isArrow ? instanceEventHandler : instanceEventHandler.bind(currentInstance.data)
        );
      });
    });
  }

  function isParentInstanceUpdating(startInstance) {
    let { parent } = startInstance;

    while (!parent.isUpdating) {
      if (parent.parent) break;
      parent = parent.parent;
    }

    return parent.isUpdating;
  }

  return new Proxy(instances, {
    get: (target, property) => target[property],
    set: async (target, property, value) => {
      const ele = value[0];
      const component = value[1];

      const ident = utils.getIdent(ele);

      const currentInstance = instances[ident.self] || {
        id: ident.self,
        name: property,
        parent: instances[ident.parent] || null,
        html: ele.outerHTML,
        isStopped: false,
        isUpdating: false
      };

      currentInstance.element = ele;
      currentInstance.refs = {};
      currentInstance.slots = {};

      currentInstance.reConnect = () => {
        if (!currentInstance.isUpdating && !isParentInstanceUpdating(currentInstance)) {
          currentInstance.isUpdating = true;
          currentInstance.element.replaceWith(currentInstance.html);
        }
      };

      currentInstance.element.currentInstanceId = currentInstance.id;

      currentInstance.element.destroy = () => {
        currentInstance.element.remove();
      };

      if (currentInstance.isStopped) {
        currentInstance.element.remove();
        return false;
      }

      if (!currentInstance.template) {
        currentInstance.template = createInstanceTemplate(
          currentInstance.id,
          component[property].template
        );
      }

      currentInstance.fragment = currentInstance.template.content.cloneNode(true);

      // refs
      currentInstance.fragment.getNodeList('element', (node) => node.hasAttribute('ref')).forEach((item) => {
        currentInstance.refs[item.getAttribute('ref')] = item;
        item.removeAttribute('ref');
      });

      // slot
      const slotContents = currentInstance.element.querySelectorAll('[slot]');
      if (!slotContents.length) {
        currentInstance.slots._ = currentInstance.element.innerHTML;
      } else {
        slotContents.forEach((item) => {
          currentInstance.slots[item.slot] = item.outerHTML;
        });
      }

      const slots = currentInstance.fragment.querySelectorAll('slot');
      if (slots) {
        slots.forEach((item) => {
          if (!item.name) item.replaceWith(currentInstance.slots._);
          item.replaceWith(currentInstance.element.querySelector(`[slot="${item.name}"]`)?.outerHTML);
        });
      }

      const $ = {
        refs: currentInstance.refs,
        slots: currentInstance.slots,
        stopRendering: () => {
          currentInstance.isStopped = true;
        },
        reConnect: currentInstance.reConnect,
        ...module
      };

      currentInstance.childProps = {};
      currentInstance.props = buildProps(currentInstance);
      buildChildProps(currentInstance);

      // script to currentInstance
      const script = utils.binder({ $ }, `{ ${component[property]?.script} }`);

      if (!currentInstance.data) {
        currentInstance.data = Object.assign(script.data, currentInstance.props);
      } else {
        currentInstance.data = Object.assign(currentInstance.data, currentInstance.props);
      }

      // watch props
      Object.keys(currentInstance.props).forEach((item) => {
        if (item !== '$obj') {
          currentInstance.data.watch(item, propWatchHandler.bind(currentInstance));
        }
      });

      // create comp
      if (script.comp) {
        Object.entries(script.comp).forEach((entry) => {
          const [key, val] = entry;

          currentInstance.data[key] = val?.getType === dataTypes.function ? val.call(currentInstance.data) : val;
        });
      }

      // create methods
      if (script.methods) {
        Object.entries(script.methods).forEach((entry) => {
          const [key, val] = entry;

          currentInstance.data[key] = val?.getType === dataTypes.function ? val.bind(currentInstance.data) : val;
        });
      }

      // currentInstance.methods = createMethodBindings(script.methods, currentInstance.data);
      // currentInstance.data = Object.assign(currentInstance.data, script.methods);

      if (script.watching) {
        currentInstance.watching = script.watching;
        watcher.add(currentInstance);
      }

      // build instance methods
      currentInstance.pre = script.pre?.bind(currentInstance.data);
      currentInstance.created = script.created?.bind(currentInstance.data);
      currentInstance.merged = script.merged?.bind(currentInstance.data);
      currentInstance.destroy = script.destroy?.bind(currentInstance.data);
      currentInstance.updated = script.updated?.bind(currentInstance.data);

      currentInstance.events = createEventBindings(script.events, currentInstance.data);

      // build the custom script extensions
      Object.entries(utils.buildExtensions(script, currentInstance.data)).forEach(([k, v]) => {
        currentInstance[k] = v;
      });

      if (currentInstance.pre?.isAsync) await currentInstance.pre();
      else currentInstance.pre?.();

      if (currentInstance.isStopped) {
        currentInstance.element.remove();
        return false;
      }

      if (!document.head.querySelector(`style[data-name="${property}"]`)) {
        document.head.append(`<style data-name="${property}">${component[currentInstance.name].style}</style>`);
      }

      currentInstance.element.innerHTML = '';

      currentInstance.childs = {};

      currentInstance.fragment.getNodeList('element', (node) => node.localName.includes('-')).forEach((item) => {
        currentInstance.childs[utils.getIdent(item).self] = item;
      });

      // build the DOM
      await mediator.run('build', currentInstance);

      if (currentInstance.created?.isAsync) await currentInstance.created();
      else currentInstance.created?.();
      if (currentInstance.isStopped) {
        currentInstance.element.remove();
        return false;
      }

      if (currentInstance.events) buildEventListeners(currentInstance);

      // appending fragment content to element
      while (currentInstance.fragment.firstElementChild) { ele.append(currentInstance.fragment.firstElementChild); }

      if (currentInstance.merged?.isAsync) await currentInstance.merged();
      else currentInstance.merged?.();

      if (currentInstance.isUpdating === true) {
        if (currentInstance.updated?.isAsync) await currentInstance.updated();
        else currentInstance.updated?.();
        currentInstance.isUpdating = false;
      }

      // target[ident.self] = currentInstance;

      Reflect.set(target, ident.self, currentInstance);

      return value;
    }
  });
})();

export default instance;
