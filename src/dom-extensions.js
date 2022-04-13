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
        this.innerHTML = newNode.isString ? newNode : newNode.outerHTML;
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
  }
};

export default DOMExtensions;
