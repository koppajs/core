import utils from './utils';

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

export default transformer;
