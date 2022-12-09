import objectExtensions from './object-extensions';
import DOMExtensions from './dom-extensions';

/* eslint no-extend-native: 0 */

const prototypeExtensions = (() => {
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

  Object.defineProperties(Array.prototype, {
    asyncEach: objectExtensions.asyncEach
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

export default prototypeExtensions;
