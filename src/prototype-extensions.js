import objectExtensions from './object-extensions';
import DOMExtensions from './dom-extensions';

/* eslint no-extend-native: 0 */

const prototypeExtensions = (() => {
  Object.defineProperties(Object.prototype, {
    length: objectExtensions.length,
    isObject: objectExtensions.isObject,
    isString: objectExtensions.isString,
    isBool: objectExtensions.isBool,
    isJson: objectExtensions.isJson,
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

  Object.defineProperties(String.prototype, {
    getStringType: objectExtensions.getStringType
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

  return undefined;
})();

export default prototypeExtensions;
