export default async function replacer(that) {
  let resourceSet;
  let scrollbarSize = that.getScrollbarSize();

  let requestResource = async url => {
    let response = await that.caller.get({ url, save: true });

    if(response.ok) {
      return /\.json$/.test(url) ? JSON.parse(response.content.replace(/\/\*.*?\*\//gm, '')) : response.content;
    }

    return null;
  };

  let setResource = async () => {
    let resourcesGlobal = await requestResource(`./resources/strings/global.json`);
    let resourcesLocale = await requestResource(`./resources/strings/${that.getLocale()}.json`);
    let resourcesImages = await requestResource(`./resources/images/index.json`);

    if(resourcesGlobal && resourcesLocale && resourcesImages) {
      resourceSet = Object.assign({},resourcesGlobal,
        resourcesLocale,
        resourcesImages);
    }

    resourceSet.scrollbarSize = scrollbarSize;
  };

  let interpreting = (val, data) => {
    if(data !== undefined) {
      return interpreteDataPlaceholder(val, data);
    } else {
      return interpreteStringPlaceholder(val);
    }
  };

  let handlingData = (m, c, data) => {
    let d, parts = c.split('.');

    c = 'data';
    
    for(let part of parts) {
      if(/^[\D][^\W]*$/.test(part)) { // normal string
        c += `?.${part}`;
      } else { // complex string
        if(/^([^\d\s][\w-_]+)\(([^()]*)\)+$/.test(part)) { // its function
          c += `.${part}`;
        } else {
          c += `['${part}']`;
        }
      }
    }

    d = eval(c);

    return d ? d : m;
  };

  let interpreteStringPlaceholder = (val) => {
    let stringResources = resourceSet;
    return stringResources[val] ? stringResources[val] : val.replace(/(\[\[)([a-zA-Z0-9\-\.\(\)|_?!&%$§"`'#:;, ]+)(\]\])/g, (m, c1, c2, c3) => stringResources[c2]);
  };

  let interpreteDataPlaceholder = (val, data) => {
    let pattern = /(\{\{)([a-zA-Z0-9\-\.\(\)|_?!&%$§"`'#:;, ]+)(\}\})/g;

    if(val.isString) {
      return val.replace(pattern, (m, c1, c2, c3) => {
        return handlingData(m, c2, data);
      });
    } else if(val.isElement) {
      for(let node of val.getNodeList('text')) {
        node.data = node.data.replace(pattern, (m, c1, c2, c3) => {
          return handlingData(m, c2, data);
        });
      }
    }
  };

  // init
  await setResource();

  return {
    interpreting
  };
}
