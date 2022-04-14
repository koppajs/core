import transformer from './transformer';
import mediator from './mediator';
import instance from './instance';

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

      return true;
    }
  });
})();

export default component;
