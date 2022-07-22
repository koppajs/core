/* eslint no-extend-native: 0 */
/* eslint func-names: 0 */

const dataTypes = {
  string: 'String',
  number: 'Number',
  array: 'Array',
  element: 'Element',
  object: 'Object',
  function: 'Function',
  bool: 'Bool'
};

const functionTypes = {
  arrow: 'Arrow',
  async: 'Async',
  normal: 'Normal'
};

const stringTypes = {
  json: 'Json',
  normal: 'Normal'
};

const prototypeExtensions = (() => {
const objectExtensions = {
  length: {
    get() {
      return Object.keys(this).length;
    }
  },
  isObject: {
    get() {
      return typeof this === 'object' && this !== null;
    }
  },
  isString: {
    get() {
      return typeof this === 'string' || this instanceof String;
    }
  },
  isBool: {
    get() {
      if (this.isString) {
        if (this.trim() === 'true' || this.trim() === '1' || this.trim() === 'false' || this.trim() === '0') {
          return true;
        }
      }
      if (this === true || this === 1 || this === false || this === 0) return true;
      return typeof this === 'boolean' || this instanceof Boolean;
    }
  },
  isJson: {
    get() {
      try { JSON.parse(this); } catch (e) { return false; } return true;
    }
  },
  isFunction: {
    get() {
      return !!(this && this.constructor && this.call && this.apply);
    }
  },
  isArrow: {
    get() {
      return typeof this === 'function' && (/^([^{=]+|\(.*\)\s*)?=>/).test(this.toString().replace(/\s/, ''));
    }
  },
  isAsync: {
    get() {
      return this[Symbol.toStringTag] === 'AsyncFunction';
    }
  },
  isNumber: {
    get() {
      if (typeof this === 'number' || (this.isString && this.match(/^[-+]?[0-9]*[,.]?[0-9]*$/g))) { return true; }
      return false;
    }
  },
  isElement: {
    get() {
      return (typeof HTMLElement === 'object'
        ? this instanceof HTMLElement
        : this && typeof this === 'object' && this !== null && this.nodeType === 1 && typeof this.nodeName === 'string'
      );
    }
  },
  toNumber: {
    get() {
      const self = Number(this) ? Number(this) : this.replace(/,/g, '.').replace(/^\./g, '0.').replace(/\.$/g, '.00');
      if (typeof self === 'number') return self;
      if (self.match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)) {
        return parseFloat(self);
      }
      return parseInt(self, 10);
    }
  },
  toBool: {
    get() {
      if (this.isBool) {
        if (this.isString) {
          if (this.trim() === 'true' || this.trim() === '1') return true;
          if (this.trim() === 'false' || this.trim() === '0') return false;
        }
        if (this === true || this === 1) return true;
        if (this === false || this === 0) return false;
        return !!this;
      }
      return false;
    }
  },

  getType: {
    get() {
      if (this.isString) return dataTypes.string;
      if (this.isBool) return dataTypes.bool;
      if (this.isFunction) return dataTypes.function;
      if (this.isNumber) return dataTypes.number;
      if (this.isElement) return dataTypes.element;
      if (Array.isArray(this)) return dataTypes.array;
      return dataTypes.object;
    }
  },

  getFunctionType: {
    get() {
      if (this.isArrow) return functionTypes.arrow;
      if (this.isAsync) return functionTypes.async;
      return functionTypes.normal;
    }
  },

  getStringType: {
    get() {
      if (this.isJson) return stringTypes.json;
      return stringTypes.normal;
    }
  },

  watch: {
    enumerable: false,
    configurable: true,
    writable: false,
    value(prop, handler) {
      let old; let cur;
      old = this[prop];
      cur = old;
      const getter = () => cur;
      const setter = (val) => {
        old = cur;
        cur = handler.call(this, prop, old, val);
        return cur;
      };

      // can't watch constants
      if (delete this[prop]) {
        Object.defineProperty(this, prop, {
          get: getter,
          set: setter,
          enumerable: true,
          configurable: true
        });
      }
    }
  },

  byString: {
    get() {
      return (obj, strg) => {
        let s = strg.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, ''); // convert indexes to properties
        const a = s.split('.');
        let o = obj;

        for (let i = 0, n = a.length; i < n; i += 1) {
          const k = a[i];
          if (k in o) {
            o = o[k];
          } else {
            return undefined;
          }
        }

        return o;
      };
    }
  }
};

  const DOMExtensions = {
    getNodeList: {
      get() {
        return (type, filter) => {
          let nodeType; const nodeList = [];
  
          if (!type) type = 'all';
  
          if (type.isFunction) {
            filter = type;
            type = 'all';
          }
  
          switch (type) {
          case 'element':
            nodeType = NodeFilter.SHOW_ELEMENT;
            break;
          case 'text':
            nodeType = NodeFilter.SHOW_TEXT;
            break;
          case 'comment':
            nodeType = NodeFilter.SHOW_COMMENT;
            break;
          case 'all':
            nodeType = NodeFilter.SHOW_ALL;
            break;
          default:
            nodeType = NodeFilter.SHOW_ALL;
          }
  
          const nodeFilter = (node) => {
            if (filter ? filter(node) : true) { return NodeFilter.FILTER_ACCEPT; }
            return NodeFilter.FILTER_SKIP;
          };
  
          const treeWalker = document.createTreeWalker(this, nodeType, nodeFilter, false);
  
          while (treeWalker.nextNode()) {
            nodeList.push(treeWalker.currentNode);
          }
  
          return nodeList;
        };
      }
    },
    toggleClass: {
      get() {
        return (classes) => {
          classes.split(/, */g).forEach((c) => this.classList.toggle(c));
          return this;
        };
      }
    },
    addClass: {
      get() {
        return (c) => {
          this.classList.add(c);
          return this;
        };
      }
    },
    removeClass: {
      get() {
        return (c) => {
          this.classList.remove(c);
          return this;
        };
      }
    },
    hasClass: {
      get() {
        return (c) => !!this.classList.contains(c);
      }
    },
    replaceWith: {
      get() {
        return (newNode) => {
          const parent = this.parentNode;
          if (newNode?.isElement) parent.replaceChild(newNode, this);
          else if (newNode?.isString) {
            this.before(newNode);
            this.remove();
          }
        };
      }
    },
    siblings: {
      get() {
        return (callback) => {
          const siblings = []; let
            sibling = this.parentNode.firstChild;
          while (sibling) {
            if (sibling.nodeType === 1 && sibling !== this) {
              if (callback) callback(sibling);
              siblings.push(sibling);
            }
            sibling = sibling.nextSibling;
          }
  
          return siblings;
        };
      }
    },
    before: {
      get() {
        return (newNode) => {
          if (newNode.isElement) this.parentNode.insertBefore(newNode, this);
          else if (newNode.isString) this.insertAdjacentHTML('beforebegin', newNode);
        };
      }
    },
    after: {
      get() {
        return (newNode) => {
          if (newNode.isElement) {
            if (this.nextSibling) this.parentNode.insertBefore(newNode, this.nextSibling);
            else this.parentNode.append(newNode);
          } else if (newNode.isString) this.insertAdjacentHTML('afterend', newNode);
        };
      }
    },
    prepend: {
      get() {
        return (newNode) => {
          if (newNode.isElement) {
            if (this.children.length < 1) this.append(newNode);
            else this.firstElementChild.before(newNode);
          } else if (newNode.isString) this.insertAdjacentHTML('afterbegin', newNode);
        };
      }
    },
    append: {
      get() {
        return (newNode) => {
          if (newNode.isElement) this.appendChild(newNode);
          else if (newNode.isString) this.insertAdjacentHTML('beforeend', newNode);
        };
      }
    },
    html: {
      get() {
        return (newNode) => {
          this.innerHTML = newNode?.isString ? newNode : newNode.outerHTML;
        };
      }
    },
    attr: {
      get() {
        return (attrName, attrValue) => {
          if (attrValue !== undefined) this.setAttribute(attrName, attrValue || 'true');
          return this.getAttribute(attrName);
        };
      }
    },
    createHTML: {
      get() {
        return (html) => {
          const placeholder = document.createElement('div');
          placeholder.innerHTML = html;
  
          if (placeholder.children.length === 1) return placeholder.firstElementChild;
  
          const nodes = [];
  
          while (placeholder.firstElementChild) {
            nodes.push(placeholder.firstElementChild);
          }
  
          return nodes;
        };
      }
    }
  };

  Object.defineProperties(Object.prototype, {
    length: objectExtensions.length,
    isObject: objectExtensions.isObject,
    isString: objectExtensions.isString,
    isBool: objectExtensions.isBool,
    isFunction: objectExtensions.isFunction,
    isArrow: objectExtensions.isArrow,
    isAsync: objectExtensions.isAsync,
    isNumber: objectExtensions.isNumber,
    isElement: objectExtensions.isElement,
    toNumber: objectExtensions.toNumber,
    toBool: objectExtensions.toBool,
    getType: objectExtensions.getType,
    watch: objectExtensions.watch
  });

  Object.defineProperties(Object, {
    byString: objectExtensions.byString
  });

  Object.defineProperties(String.prototype, {
    getStringType: objectExtensions.getStringType,
    isJson: objectExtensions.isJson
  });

  Object.defineProperties(Function.prototype, {
    getFunctionType: objectExtensions.getFunctionType
  });

  Object.defineProperties(DocumentFragment.prototype, {
    getNodeList: DOMExtensions.getNodeList
  });

  Object.defineProperties(HTMLElement.prototype, {
    getNodeList: DOMExtensions.getNodeList,
    toggleClass: DOMExtensions.toggleClass,
    addClass: DOMExtensions.addClass,
    removeClass: DOMExtensions.removeClass,
    hasClass: DOMExtensions.hasClass,
    replaceWith: DOMExtensions.replaceWith,
    siblings: DOMExtensions.siblings,
    before: DOMExtensions.before,
    after: DOMExtensions.after,
    prepend: DOMExtensions.prepend,
    append: DOMExtensions.append,
    html: DOMExtensions.html,
    attr: DOMExtensions.attr
  });

  Object.defineProperties(Document.prototype, {
    createHTML: DOMExtensions.createHTML
  });
})();

const binder = function (_____, ____) { // declarations, script
  return eval(`((${Object.keys(_____).map((item) => `${item} = _____.${item}`).join(', ')}) => {
    let koppa, binder, item, _____, ____; return ${____};
  })();`);
};

const watcher = (() => {
  const target = {};
  const refs = {};

  function dataWatchHandler(propName, oldVal, newVal) {
    if (oldVal !== newVal) {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        this.reConnect();
      }, 2);

      return newVal;
    }

    return oldVal;
  }

  function externalWatchHandler(propName, oldVal, newVal) {
    if (oldVal !== newVal) {
      const playTimeout = (refIdentifier) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          refs[refIdentifier]?.forEach((item) => {
            item.reConnect();
          });
        }, 2);
      };

      let refIdentifier = this;
      while (refIdentifier !== '$') {
        playTimeout(refIdentifier);
        refIdentifier = refIdentifier.substr(0, refIdentifier.lastIndexOf('.'));
      }

      return newVal;
    }

    return oldVal;
  }

  function findTarget(searchStrg) {
    return Object.keys(target).filter((item) => searchStrg.startsWith(item))[0];
  }

  function addWatchRef(newRef, instance) {
    if (!refs[newRef]) refs[newRef] = [];
    if (!refs[newRef]?.includes(instance)) refs[newRef]?.push(instance);
  }

  function add(instance) {
    instance.watching.forEach((item) => {
      if (item.getType === dataTypes.string) {
        if (item.startsWith('$')) { // external watchings
          const curTargetObjPath = findTarget(item);
          const curTargetObj = target[findTarget(item)];
          const curItemPath = item.replace(new RegExp(`^\\${curTargetObjPath}.?`), '');
          const curItemPathArray = curItemPath.split('.');
          const curItemName = curItemPathArray.pop();
          const curParentItemPath = curItemPathArray.join('.');

          addWatchRef(`${curTargetObjPath}${curItemPath ? `.${curItemPath}` : ''}`, instance);

          if (curItemPath) {
            if (curParentItemPath) { // items thath deeper nested as one lvl
              Object.byString(curTargetObj, curParentItemPath)
                .watch(curItemName, externalWatchHandler.bind(item));
            } else { // items in first nested lvl
              curTargetObj.watch(curItemName, externalWatchHandler.bind(item));
            }
          }
        } else {
          const itemArray = item.split('.');
          if (itemArray.length === 1) { // data
            instance.data.watch(itemArray[0], dataWatchHandler.bind(instance));
          } else { // deep nested in data
            const itemKey = itemArray.pop();
            Object.byString(instance.data, itemArray.join('.')).watch(itemKey, dataWatchHandler.bind(instance));
          }
        }
      }
    });
  }

  const createTarget = (path, obj) => {
    target[`$.${path}`] = obj;
    return obj;
  };

  return {
    add,
    createTarget
  };
})();

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
      let script;

      try {
        script = utils.binder({ $ }, `{ ${component[property]?.script} }`);
      } catch (error) {
        window.console.error(`You have an Error in Script of "${property}" component`);
        return false;
      }

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

const mediator = (() => {
  const mediators = {
    connected: [], // when the component is connected
    build: [ // manipulate DOM by building component instance
      function loopRunner(instance) {
        instance.fragment.getNodeList('element', (node) => node.hasAttribute('loop')).forEach((loopNode) => {
          const attr = utils.replaceData(loopNode.getAttribute('loop'), instance.data).split(' in ');
          loopNode.removeAttribute('loop');
          const data = utils.binder(instance.data, `(() => ${attr[1]})()`);
          let ret = '';

          if (data) {
            data.forEach((item, i) => {
              ret += loopNode.outerHTML.replace(
                /\{\{([^⹇]*?)\}\}/g,
                (m, c) => eval(`(() => {const ${attr[0]} = ${JSON.stringify(item)}; const n = '${i}'; return ${c};})()`)
              );
            });
          }

          loopNode.replaceWith(ret);
        });
      },

      function nodeRunner(instance, elementNodes, textNodes) {
        let newTextNodes = [];
        let newElementNodes = [];
        if (!elementNodes) elementNodes = instance.fragment.getNodeList('element');
        if (!textNodes) textNodes = instance.fragment.getNodeList('text');
        const container = document.createElement('div');

        // Element-Attributes
        elementNodes.forEach((elementNode) => {
          [...elementNode.attributes].forEach((attribute) => {
            if (attribute.name.startsWith('@')) {
              utils.buildTrigger(attribute, elementNode);
            }

            attribute.value = utils.replaceData(attribute.value, instance.data);
          });
        });

        // Text-Nodes
        textNodes.forEach((textNode) => {
          if (textNode.data !== ' ') {
            container.innerHTML = utils.replaceData(textNode.data, instance.data);

            while (container.firstChild) {
              const childNode = container.firstChild;
              textNode.before(childNode);
              if (childNode.nodeName !== '#text') {
                newElementNodes = newElementNodes.concat(childNode.getNodeList('element'));
                newTextNodes = newTextNodes.concat(childNode.getNodeList('text'));
              }
            }
          }
          textNode.remove();
        });

        container.remove();

        if (newElementNodes.length || newTextNodes.length) {
          nodeRunner(instance, newElementNodes, newTextNodes);
        }
      },

      function conditionRunner(instance) {
        instance.fragment.getNodeList('element', (elementNode) => elementNode.hasAttribute('if'))
          .forEach((elementNode) => {
            const attr = elementNode.getAttribute('if');
            const binded = utils.binder(instance.data, `(() => { try { return ${attr}; } catch { return false; } })()`);
            if (!binded) elementNode.remove();
            else elementNode.removeAttribute('if');
          });
      }
    ],
    after: [] // run every after all
  };

  const add = async (mediatorGroup, mediatorCallback) => mediators[mediatorGroup].push(mediatorCallback);

  const run = async (mediatorGroup, mediatorValue) => {
    await mediators[mediatorGroup]?.reduce(
      (p, c) => p.then(async () => {
        if (c.isAsync) await c(mediatorValue);
        else c(mediatorValue);
      }),
      Promise.resolve(null)
    );
  };

  return {
    add,
    run
  };
})();

const transformer = (() => {
  const transformers = {
    source: [ // manipulate the source string of every component
      (source) => { // property transformer
        let counter = -1;

        // build props attributes only by custom elements start tag
        source = source.replace(
          /<[^/]?\s*[\w]{1}[\w\d]*-[\w\d]+\s*[^>]*>/g,
          (tagMatch) => tagMatch.replace(/:([\w]{1}[\w\d]*)(="([^"]*)")?/g, (m, c1, c2, c3) => {
            counter += 1;

            if (c1 === 'obj') return `:p${counter}="${`$_${c3.replace(/({{)|(}})/g, '')}`}|${c3}"`;
            if (!c3) return `:p${counter}="${c1}"`;
            return `:p${counter}="${c1}|${c3}"`;
          })
        );

        return source;
      },
      (source) => { // source to part transformer
        source = new DOMParser().parseFromString(source, 'text/html');

        source = {
          template: source.children[0].children[0].children[0].innerHTML.trim() || '',
          script: source.children[0].children[0].children[1].innerHTML.trim() || 'data: {}',
          style: source.children[0].children[0].children[2].innerHTML.trim() || ''
        };

        return source;
      }
    ]
  };

  const add = async (transformerGroup, transformerCallback) => transformers[transformerGroup].push(transformerCallback);

  const run = async (transformerGroup, value) => {
    if (!value) return false;

    await transformers[transformerGroup]?.reduce(
      (p, c) => p.then(async () => {
        value = c.isAsync ? await c(value) : c(value);
      }),
      Promise.resolve(null)
    );

    return value;
  };

  return {
    add,
    run
  };
})();

const module = (() => {
  const modules = {};

  return new Proxy(modules, {
    get: (target, property) => target[property],
    set: async (target, property, value) => {
      target[property] = value;

      let currentModule = value.bind({
        getId: utils.getId,
        getIdent: utils.getIdent,
        createTrigger: utils.createTrigger,
        addExtension: utils.addExtension,
        dataTypes: utils.dataTypes,
        mediator,
        transformer,
        take: utils.take,
        module: modules,
        instance,
        component,
        watcher
      });

      currentModule = currentModule.isAsync ? await currentModule() : currentModule();
      if (currentModule?.isObject) target[property] = currentModule;

      return value;
    }
  });
})();

const component = (() => {
  const components = {};

  return new Proxy(components, {
    get: (target, property) => target[property],
    set: async (target, property, value) => {
      // source transformation
      value = await transformer.run('source', value);

      customElements.define(property, class extends HTMLElement {
        async connectedCallback() {
          instance[property] = await (async () => [this, component])();

          const waitFor = (callback) => {
            const timeout = setTimeout(async () => {
              clearTimeout(timeout);
              if (instance[this.instanceId]) {
                if (callback.isAsync) await callback(instance[this.instanceId]);
                else callback(instance[this.instanceId]);
              } else {
                waitFor(callback);
              }
            }, 50);
          };

          waitFor(async () => {
            await mediator.run('connected', this);
          });
        }

        disconnectedCallback() { this.destroy?.(); }
      });

      target[property] = value;

      return value;
    }
  });
})();

const utils = (() => {
  const usedIds = [];
  const customEvents = {};
  const customEventsDetails = {};
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
    const attrName = attr.name.substring(1);

    if (!customEvents[attrName]) {
      customEventsDetails[attrName] = [];
      customEvents[attrName] = new CustomEvent(attrName, {
        detail: () => customEventsDetails[attrName]
      });
    }
    const trigger = triggers[attrName];
    delegator.addEventListener(trigger?.type, () => {
      customEventsDetails[attrName] = attr.value.split(/,\s*/).filter((i) => i !== '');
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

const fetcher = () => {
  const responseStore = {};
  const maxNumberOfRetrys = 1;

  const fetchHandler = async (url, obj) => {
    const response = (await (fetch(url, obj)
      .then((resp) => resp)
      .catch((error) => {
        let status = 500;
        let statusText = 'Internal Server Error';

        switch (error.toString()) {
        case 'Unauthorized':
          status = 401;
          statusText = 'Unauthorized';
          break;
        case 'Not Found':
          status = 404;
          statusText = 'Not Found';
          break;
        default:
          status = 500;
          statusText = 'Internal Server Error';
        }

        return {
          body: null,
          bodyUsed: false,
          content: null,
          headers: {},
          ok: false,
          redirected: false,
          status,
          statusText,
          type: 'basic',
          url
        };
      })
    ));
    return response;
  };

  const getResponse = async (url, obj) => { // find response in the responseStore
    let responseUrl = url.replace(/^\/|\.\//, `${window.location.origin}/`);

    if (!responseUrl.includes(window.location.origin) && !/^((http|https|ftp):\/\/)/.test(responseUrl)) {
      responseUrl = `${window.location.origin}/${responseUrl}`;
    }

    obj.credentials = !responseUrl.match(new RegExp(window.location.origin, 'ig')) ? 'same-origin' : 'include';

    let ret = responseStore[responseUrl];

    if (!responseStore[responseUrl]) ret = await fetchHandler(url, obj);

    return ret;
  };

  const request = async (obj, tryCounter = 0) => {
    if (!obj.headers) obj.headers = {};

    obj.mode = 'cors';
    obj.cache = 'default';

    tryCounter += 1;

    if (obj.method !== 'GET') {
      obj.headers['Content-Type'] = obj.data.isObject ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
      obj.body = JSON.stringify(obj.data);
    }

    const response = await getResponse(obj.url, obj);

    if (response?.ok) {
      if (!response.content) response.content = await response.text();

      if (obj && obj.isObject && obj.save && !responseStore[response.url]) { responseStore[response.url] = response; }
    } else if (tryCounter < maxNumberOfRetrys) {
      const req = await request(obj, tryCounter);
      return req;
    }

    return response;
  };

  return {
    get: async (obj) => {
      if (obj.isString) {
        obj = {
          url: obj
        };
      }

      obj.method = 'GET';
      const response = await request(obj);
      return response;
    },
    post: async (obj) => {
      obj.method = 'POST';
      const response = await request(obj);
      return response;
    },
    put: async (obj) => {
      obj.method = 'PUT';
      const response = await request(obj);
      return response;
    },
    delete: async (obj) => {
      obj.method = 'DELETE';
      const response = await request(obj);
      return response;
    }
  };
};

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

function router() {
  const routes = [];
  let currentRoute = null;

  const popStateEvent = new Event('popstate', null);

  const { protocol } = window.location;
  const { hostname } = window.location;
  const { port } = window.location;

  const basePath = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  // node Header Template
  const headerTemplates = {
    charset: '<meta charset="utf-8"/>',
    title: '<title>{{content}}</title>',
    description: '<meta name="description" content="{{content}}"/>',
    keywords: '<meta name="keywords" content="{{content}}"/>',
    author: '<meta name="author" content="{{content}}"/>',
    copyright: '<meta name="copyright" content="{{content}}"/>',
    robots: '<meta name="robots" content="{{content}}"/>',
    'cache-control': '<meta http-equiv="cache-control" content="{{content}}"/>',
    expires: '<meta http-equiv="expires" content="{{content}}"/>',
    refresh: '<meta http-equiv="refresh" content="{{content}}"/>'
  };

  // find nodes in DOM
  const headerNodes = {
    refresh: document.head.querySelector('meta[http-equiv="refresh"]'),
    expires: document.head.querySelector('meta[http-equiv="expires"]'),
    'cache-control': document.head.querySelector('meta[http-equiv="cache-control"]'),
    robots: document.head.querySelector('meta[name="robots"]'),
    copyright: document.head.querySelector('meta[name="copyright"]'),
    author: document.head.querySelector('meta[name="author"]'),
    keywords: document.head.querySelector('meta[name="keywords"]'),
    description: document.head.querySelector('meta[name="description"]'),
    title: document.head.querySelector('title'),
    charset: document.head.querySelector('meta[charset]')
  };

  // sort nodes in DOM
  Object.keys(headerNodes).forEach((item) => {
    if (headerNodes[item] !== null) {
      document.head.prepend(headerNodes[item]);
    }
  });

  const defaultHeaderContent = {
    charset: headerNodes.charset?.attr('charset'),
    title: headerNodes.title?.innerHTML || '>&#8205;',
    description: headerNodes.description?.attr('content'),
    keywords: headerNodes.keywords?.attr('content'),
    author: headerNodes.author?.attr('content'),
    copyright: headerNodes.copyright?.attr('content'),
    robots: headerNodes.robots?.attr('content'),
    'cache-control': headerNodes['cache-control']?.attr('content'),
    expires: headerNodes.expires?.attr('content'),
    refresh: headerNodes.refresh?.attr('content')
  };

  let oldHeaderContent = { ...defaultHeaderContent };
  let currentHeaderContent = { ...defaultHeaderContent };

  const setHeader = (obj) => {
    oldHeaderContent = currentHeaderContent;
    currentHeaderContent = {};

    Object.keys(headerNodes).forEach((item) => {
      if (obj[item] !== undefined && obj[item] === false) {
        currentHeaderContent[item] = obj[item] || defaultHeaderContent[item] || false;
      } else {
        currentHeaderContent[item] = obj[item] || oldHeaderContent[item] || defaultHeaderContent[item] || false;
      }
    });

    Object.keys(headerNodes).forEach((item) => {
      if (currentHeaderContent[item] === false) { // remove
        headerNodes[item]?.remove();
      } else if (currentHeaderContent[item] !== false && headerNodes[item] === null) { // create
        headerNodes[item] = document.createHTML(headerTemplates[item].replace(
          /{{content}}/,
          currentHeaderContent[item]
        ));
      } else { // update
        if (item !== 'title' && item !== 'charset') {
          headerNodes[item].attr('content', currentHeaderContent[item]);
        } else if (item === 'charset') {
          headerNodes[item].attr('charset', currentHeaderContent[item]);
        } else if (item === 'title') {
          headerNodes[item].innerHTML = currentHeaderContent[item];
        }
      }
    });

    currentHeaderContent = Object.fromEntries(Object.entries(currentHeaderContent).filter(([, val]) => val !== false));
  };

  const getHeader = () => currentHeaderContent;

  // remove slasches on bstart and end of string
  const clearSlashes = (val) => val.toString()
    .replace(/\/+/g, '/')
    .replace(/((\/$)|(^\/)|(^\.\.\/)|(^\.\/))/g, '')
    .replace(/http:\/+/g, 'http://')
    .replace(/https:\/+/g, 'https://');

  const urlBuilder = (parts) => {
    let url = '';

    parts.forEach((item) => {
      url += `${url === '' ? '' : '/'}${clearSlashes(item)}`;
    });

    return url;
  };

  const findRoute = () => {
    let ret = false;
    if (!routes.length) return ret;

    const pathname = clearSlashes(window.location.pathname);
    const pathnameParts = pathname.split('/');

    routes.forEach((route) => {
      route.params = {};
      const pathParts = route.path.split('/');

      if (JSON.stringify(pathnameParts) === JSON.stringify(pathParts)) {
        pathParts.forEach((value, index) => {
          if (value.charAt(0) === ':') {
            const valueParts = value.slice(1, value.length - 1).split('<');
            const pattern = new RegExp(valueParts[1], 'g');
            if (pattern.test(pathnameParts[index])) {
              route.params[valueParts[0]] = pathnameParts[index];
            }
          }

          if (index === pathParts.length - 1) {
            ret = route;
          }
        });
      }
    });

    return ret;
  };

  // routingHandler manage the content change inside the router view and component refinding
  const routingHandler = async (node, instance) => {
    const route = findRoute();
    let currentComponent = true;

    if (route) {
      if (!window.history.state || window.history.state.middleware !== false) {
        currentComponent = instance.data[instance.data.$obj].middleware
          ? await instance.data[instance.data.$obj].middleware(route)
          : true;
      }

      if (currentComponent === true) {
        currentComponent = route.handler ? await route.handler(route.params) : true;
      }

      if (currentComponent === true) {
        currentComponent = route.component;
      }

      if (currentComponent === false) {
        currentComponent = 'error-404';
      }

      if (currentComponent.isString) {
        if (this.component[currentComponent] === undefined) {
          currentComponent = 'error-404';
          node.html(`<${currentComponent}></${currentComponent}>`);
        } else {
          node.html(`<${currentComponent}></${currentComponent}>`);
        }
      }
    } else {
      currentComponent = 'error-404';
      this.html(`<${currentComponent}></${currentComponent}>`);
    }
    currentRoute = route;
  };

  const setListener = (node, instance) => {
    window.addEventListener('popstate', async () => {
      await routingHandler(node, instance);
    }, true);
  };

  const add = (route) => {
    let isAdded = false;
    route.path = clearSlashes(route.path);

    routes.forEach((item) => {
      isAdded = item.path === route.path;
    });

    if (!isAdded) {
      route.params = {};
      routes.push(route);
    }
  };

  const grabRoutes = (grabbedRoutes) => grabbedRoutes.forEach((item) => {
    if (item.handler) item.handler = item.handler.bind(item);
    add(item);
  });

  const push = (path = '', state = {}) => {
    window.renderCounter = 0;
    window.history.pushState(state, null, urlBuilder([basePath, path]));
    dispatchEvent(popStateEvent);
  };

  const replace = (path = '', state = {}) => {
    window.renderCounter = 0;
    window.history.replaceState(state, null, urlBuilder([basePath, path]));
    dispatchEvent(popStateEvent);
  };

  const getParams = () => currentRoute.params;

  this.mediator.add('connected', async (node) => {
    const instance = this.instance[node.instanceId];

    if (node.localName === 'router-view') {
      setListener(node, instance);
      if (instance.data.$obj) {
        grabRoutes(instance.data[instance.data.$obj].routes);
        await routingHandler(node, instance); // first run
      }
    }

    if (instance.head) {
      setHeader(instance.head);
    }
  });

  this.mediator.add('after', () => {
    document.querySelectorAll('[push]').forEach((node) => {
      node.attr('href', node.attr('push'));
      node.removeAttribute('push');
      node.addEventListener('click', (event) => {
        event.preventDefault();
        push(event.target.closest('[href]').attr('href'));
      });
    });
  });

  this.addExtension('head', this.dataTypes.object);

  this.take('router-view', '<template></template><script></script><style></style>');

  return {
    add,
    push,
    replace,
    getParams,
    basePath,
    clearSlashes,
    urlBuilder,
    getHeader
  };
}

const koppa = (() => {
  let mutate = false;

  /**
   * Observer to run mediator after html change
   *
   * @type {MutationObserver}
   */
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach(() => {
      // run it once
      if (!mutate) {
        const timeout0 = setTimeout(async () => {
          clearTimeout(timeout0);
          await mediator.run('after');
        }, 50);

        const timeout1 = setTimeout(() => {
          clearTimeout(timeout1);
          mutate = false;
        }, 100);

        mutate = true;
      }
    });
  });

  /**
   * Run mediator after document is finish loaded and rendered
   */
  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      const timeout = setTimeout(async () => {
        clearTimeout(timeout);
        await mediator.run('after');
        observer.observe(document.body, { subtree: true, childList: true });
      }, 200);
    }
  };

  // take the standard modules
  utils.take(fetcher);
  utils.take(store);
  utils.take(router);

  // create app container element
  const core = (componentName) => document.body.prepend(`<${componentName}></${componentName}>`);

  // add take to make it available from the outside
  core.take = utils.take;

  return core;
})();
