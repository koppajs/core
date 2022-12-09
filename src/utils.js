import binder from './binder';
import module from './module';
import component from './component';
import {dataTypes} from './types';

const utils = (() => {
    const usedIds = [];
    const customEvents = {};
    const customEventsDetails = {};
    const triggers = {};
    const extensions = {}; // script Extensions

    const getId = () => {
        // generate custom id
        const max = 99999999;
        const id = Math.floor(Math.random() * max);

        if (usedIds.includes(id)) {
            return getId();
        }

        usedIds.push(id);
        return id;
    };

    const getIdent = (ele) => {
        const ident = ele.dataset.instance?.split('|') || [getId(), null];
        const self = ident[0]?.toNumber;
        let parent = ident[1]?.toNumber;

        if (!parent) {
            const closestParent = ele.closest(
                `[data-instance]:not([data-instance="${
                    ele.dataset.instance || ''
                }"])`,
            );
            if (closestParent) {
                parent = closestParent.dataset.instance.split('|')[0] || null;
            }
        }

        ele.dataset.instance = `${self}${parent ? `|${parent}` : ''}`;
        ele.instanceId = self;

        return {
            self,
            parent,
        };
    };

    const replaceData = (strg, data) =>
        strg.replace(/\{\{([^{{}}]*)\}\}/g, (m, c) => {
            if (c[0] === ':') return `{{${c.substr(1)}}}`;

            let ret = eval(`try { data.${c} } catch { 'undefined' }`);

            if (ret?.isFunction) ret = ret.call(data);
            else if (ret === null) ret = 'null';
            return ret;
        });

    const defineTrigger = (name, type, target) => {
        // define trigger
        triggers[name] = {type, target: target || 'body'};
    };

    const addTrigger = (attr, delegator) => {
        // add a defined trigger with arguments
        const attrName = attr.name.substring(1);
        const trigger = triggers[attrName];

        if (trigger) {
            if (!customEvents[attrName]) {
                customEventsDetails[attrName] = [];
                customEvents[attrName] = new CustomEvent(attrName, {
                    detail: () => customEventsDetails[attrName],
                });
            }

            delegator.addEventListener(trigger?.type, () => {
                customEventsDetails[attrName] = attr.value
                    .split(/,\s*/)
                    .filter((i) => i !== '');

                const target = trigger.target.isElement
                    ? trigger.target
                    : document.querySelector(trigger.target);
                target.dispatchEvent(customEvents[attrName]);
            });
        }
    };

    /**
     * Creates Modules, Components on different ways
     *
     * @param arg1
     * @param arg2
     * @returns {Promise<void>}
     */
    function takeHandler(...args) {
        switch (args.length) {
            case 1: // module
                // eslint-disable-next-line prefer-destructuring
                if (args[0].isFunction) module[args[0].name] = args[0];
                break;
            case 2: // Components
                // eslint-disable-next-line prefer-destructuring
                if (args[0].isString && args[1].isString) {
                    component[args[0]] = args[1];
                }
                break;
            default:
                window.console.error('too many arguments');
        }
    }

    function take(...args) {
        if (args.length === 1 && Array.isArray(args[0])) {
            args[0].forEach((arg) => {
                if (Array.isArray(arg)) takeHandler(arg[0], arg[1]);
                else takeHandler(arg);
            });
        } else {
            takeHandler(...args);
        }
    }

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
        defineTrigger,
        addTrigger,
        binder,
        take,
        addExtension,
        buildExtensions,
        dataTypes,
    };
})();

export default utils;
