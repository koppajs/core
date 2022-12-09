import utils from './utils';

const mediator = (() => {
  const mediators = {
    connected: [], // when the component is connected
    build: [ // manipulate DOM by building component instance
      function loopRunner(instance) {
        instance.fragment.getNodeList('element', (node) => node.hasAttribute('loop')).forEach((loopNode) => {
          const attr = utils.replaceData(loopNode.getAttribute('loop'), instance.data).split(' in ');
          loopNode.removeAttribute('loop');
          console.log(attr[1]);
          const data = utils.binder(instance.data, `(()=>${attr[1]})()`);
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
              utils.addTrigger(attribute, elementNode);
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
    await mediators[mediatorGroup]?.asyncEach(async (v) => {
      if (v.isAsync) await v(mediatorValue);
      else v(mediatorValue);
    });
  };

  return {
    add,
    run
  };
})();

export default mediator;
