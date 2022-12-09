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
        const ret = {};
        const dom = new DOMParser().parseFromString(source, 'text/html');
        const filter = [
          ['template', ''],
          ['script', 'return{data:{}}'],
          ['style', '']
        ];

        filter.forEach(([identifier, fallback]) => {
          ret[identifier] = [...dom.children[0].children[0].children]
            .filter((node) => node.localName === identifier)
            .map((node) => node.innerHTML.trim()).join('') || fallback;
        });

        return ret;
      }
    ]
  };

  const add = async (transformerGroup, transformerCallback) => transformers[transformerGroup].push(transformerCallback);

  const run = async (transformerGroup, value) => {
    if (!value) return false;

    await transformers[transformerGroup]?.asyncEach(async (v) => {
      value = v.isAsync ? await v(value) : v(value);
    });

    return value;
  };

  return {
    add,
    run
  };
})();

export default transformer;
