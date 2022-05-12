const head = (() => {
  // node Templates
  const templates = {
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
  const nodes = {
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
  Object.keys(nodes).forEach((item) => {
    if(nodes[item] !== null) {
      document.head.prepend(nodes[item])
    }
  });

  const defaultContent = {
    charset: nodes.charset?.attr('charset'),
    title: nodes.title?.innerHTML ||'>&#8205;',
    description: nodes.description?.attr('content'),
    keywords: nodes.keywords?.attr('content'),
    author: nodes.author?.attr('content'),
    copyright: nodes.copyright?.attr('content'),
    robots: nodes.robots?.attr('content'),
    'cache-control': nodes['cache-control']?.attr('content'),
    expires: nodes.expires?.attr('content'),
    refresh: nodes.refresh?.attr('content')
  };

  let oldContent = Object.assign({}, defaultContent);
  let currentContent = Object.assign({}, defaultContent);

  const set = (obj) => {
    oldContent = currentContent;
    currentContent = {};

    Object.keys(nodes).forEach((item) => {
      if (obj[item] !== undefined && obj[item] === false) {
        currentContent[item] = obj[item] || defaultContent[item] || false;
      } else {
        currentContent[item] = obj[item] || oldContent[item] || defaultContent[item] || false;
      }
    });

    Object.keys(nodes).forEach((item) => {
      if(currentContent[item] === false) { // remove
        nodes[item]?.remove();
      } else if(currentContent[item] !== false && nodes[item] === null) { // create
        nodes[item] = document.createHTML(templates[item].replace(/{{content}}/, currentContent[item]));
      } else { // update
        if(item !== 'title' && item !== 'charset') nodes[item].attr('content', currentContent[item]);
        else if(item === 'charset') nodes[item].attr('charset', currentContent[item]);
        else if(item === 'title') nodes[item].innerHTML = currentContent[item];
      }
    });

    currentContent = Object.fromEntries(Object.entries(currentContent).filter(([key, val]) => val !== false));
  };

  const get = () => currentContent;

  return {
    set,
    get
  };
})();

export default head;
