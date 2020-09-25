export default function(that) {
  function Nullable() {};

  Object.defineProperties(Object.prototype, {
    'exists': {
      get: function () {
          let size = 0, key;
          for(key in this)
            if(this.hasOwnProperty(key)) size++;
          return size;
      }
    },
    'length': {
      get: function () {
          let size = 0, key;
          for(key in this)
            if(this.hasOwnProperty(key)) size++;
          return size;
      }
    },
    'isObject': {
      get: function () {
        return !(this instanceof Nullable) && typeof this === 'object' && this !== null;
      }
    },
    'isString': {
      get: function() {
        return (typeof this === 'string' || this instanceof String);
      }
    },
    'isJson': {
      get: function() {
        try {
          JSON.parse(this);
        } catch (e) {
          return false;
        }
        return true;
      }
    },
    'isFunction': {
      get: function() {
        return !!(this && this.constructor && this.call && this.apply);
      }
    },
    'isAsync': {
      get: function() {
        return this[Symbol.toStringTag] === 'AsyncFunction';
      }
    },
    'isNumber': {
      get: function() {
        if(typeof this === 'number' || this.isString && this.match(/^[-+]?[0-9]*[,\.]?[0-9]*$/g))
          return true;

        return false;
      }
    },
    'isElement': {
      get: function() {
        return (
          typeof HTMLElement === "object" ? this instanceof HTMLElement :
          this && typeof this === "object" && this !== null && this.nodeType === 1 && typeof this.nodeName === "string"
        );
      }
    },
    'toNumber': {
      get: function() {
        let self = Number(this) ? this : this.replace(/,/g, '.').replace(/^\./g, '0.').replace(/\.$/g, '.00');

        if(self.match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)) {
          return parseFloat(self);
        } else {
          return parseInt(self);
        }
        return Number(self);
      }
    },
    'watch': {
      enumerable: false,
      configurable: true,
      writable: false,
      value: function(prop, handler) {
        let old, cur, getter, setter;
        old = this[prop];
        cur = old;
        getter = () => cur;
        setter = (val) => {
          old = cur;
          cur = handler.call(this,prop,old,val);
          return cur;
        };

        // can't watch constants
        if(delete this[prop]) {
          Object.defineProperty(this,prop, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
          });
        }
      }
    }
  });

  Object.defineProperties(HTMLElement.prototype, {
    'setEventListener': {
      get: function() {
        return (type, listener, option = false) => {
          let important = false;
          if(option === 'important') {
            option = false;
            important = true;
          }

          if(!this.events)
            this.events = [];

          if(!this.events.includes(listener.toString()) || important) {
            this.events.push(listener.toString());

            if(this.process) {
              listener = listener.bind(that.processes[this.process].script.data);

              this.addEventListener(type, (event) => {
                listener(event);
              }, option);
            }
            else
              this.addEventListener(type, listener, option);
          }
        };
      }
    },
    'toggleClass': {
      get: function() {
        return (classes) => {
          for(let c of classes.replace(/ /, '').split(','))
            this.classList.toggle(c);
            return this;
        };
      }
    },
    'addClass': {
      get: function() {
        return (c) => {
          this.classList.add(c);
          return this;
        };
      }
    },
    'removeClass': {
      get: function() {
        return (c) => {
          this.classList.remove(c);
          return this;
        };
      }
    },
    'hasClass': {
      get: function() {
        return (classes) => {
          let ret = false;
          for(let c of classes.replace(/ /, '').split(',')) {
            ret = this.classList.contains(c);
          }

          return ret;
        };
      }
    },
    'replaceWith': {
      get: function() {
        return (newNode) => {
          let parent = this.parentElement;
          if(newNode.isElement)
            parent.replaceChild(newNode, this);
          else if(newNode.isString) {
            let tmpEle = document.createElement('div');
            tmpEle.innerHTML = newNode;
            parent.replaceChild(tmpEle.firstElementChild, this);
          }

          processElementAdapting(parent);
        };
      }
    },
    'siblings': {
      get: function() {
        return (f) => {
          // Setup siblings array and get the first sibling
          var siblings = [];
          var sibling = this.parentNode.firstChild;

          // Loop through each sibling and push to the array
          while (sibling) {
            if (sibling.nodeType === 1 && sibling !== this) {
              f && f(sibling);
              siblings.push(sibling);
            }

            sibling = sibling.nextSibling
          }

          return siblings;
        };
      }
    },
    'before': {
      get: function() {
        return (newNode) => {
          if(newNode.isElement)
            this.parentNode.insertBefore(newNode, this);
          else if(newNode.isString)
            this.insertAdjacentHTML('beforebegin', newNode);

          processElementAdapting(parent);
        };
      }
    },
    'append': {
      get: function() {
        return (newNode) => {
          if(newNode.isElement)
            this.appendChild(newNode);
          else if(newNode.isString)
            this.insertAdjacentHTML('beforeend', newNode);

          processElementAdapting(this);
        };
      }
    },
    'html': {
      get: function() {
        return (newNode) => {
          this.innerHTML = '';

          if(newNode.isElement)
            this.append(newNode);
          else if(newNode.isString)
            this.insertAdjacentHTML('beforeend', newNode);

          processElementAdapting(this);
        };
      }
    },
    'getNodeList': {
      get: function() {
        return (type = 'all', filter) => {
          let treeWalker, nodeType, nodeFilter, nodeList = [];

          if(type.isFunction) {
            filter = type;
            type = 'all';
          }

          switch(type) {
            case 'element':
              nodeType = NodeFilter.SHOW_ELEMENT;
            break;
            case 'text':
              nodeType = NodeFilter.SHOW_TEXT;
            break;
            case 'attribute':
              nodeType = NodeFilter.SHOW_ATTRIBUTE;
            break;
            case 'comment':
              nodeType = NodeFilter.SHOW_COMMENT;
            break;
            case 'all':
              nodeType = NodeFilter.SHOW_ALL;
            break;
          }

          nodeFilter = node => {
            if(filter ? filter(node) : true)
              return NodeFilter.FILTER_ACCEPT;
            else
              return NodeFilter.FILTER_SKIP;
          };

          treeWalker = document.createTreeWalker(this, nodeType, nodeFilter, false);

          while(treeWalker.nextNode()) {
            nodeList.push(treeWalker.currentNode);
          }

          return nodeList;
        };
      }
    }
  });

  let processElementAdapting = (element) => {
    if(element.process) {
      let nodeList = element.getNodeList('element', node => {
        return !node.process;
      });

      for(let node of nodeList) {
        node.process = element.process;
      }
    }
  };

  return undefined;
}
