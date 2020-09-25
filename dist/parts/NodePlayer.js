export default function nodePlayer(that) {
  // let customElements = {};

  let createProps = (obj, id, attr) => {
    attr = attr.isString ? attr.split('|') : attr.value.split('|');
    !obj.childProps && (obj.childProps = {});
    !obj.childProps[id] && (obj.childProps[id] = {});

    if(attr[1].isNumber) {
      obj.childProps[id][attr[0]] = attr[1].toNumber;
    } else if(attr[1].match(/[0-1a-zA-z\.\[\]]+/g).length === 1 && eval(`obj.script.data.${attr[1]}`)) {
      if(obj.parent && obj.parent.childProps[obj.id]?.[attr[0]]) { // prop delegate from parent
        obj.childProps[id][attr[0]] = obj.parent.childProps[obj.id][attr[0]];
      } else { // prop delegate from current
        obj.childProps[id][attr[0]] = {
          val: eval(`obj.script.data.${attr[1]}`),
          name: attr[1],
          process: obj
        }
      }
    } else { // prop is a string
      obj.childProps[id][attr[0]] = attr[1];
    }
  };

  let _if = (obj, ele) => {
    let check, ifAttr = ele.getAttribute('if');

    if(ifAttr == 'true' || ifAttr == '1') check = true;
    else if(ifAttr == 'false' || ifAttr == '0') check = false;
    else {
      if(ifAttr.match(/^i(\.| |\[)/g)) {
        check = eval(ifAttr.replace(/^i\./, 'obj.').replace(/^i /, 'obj ').replace(/^i\[/, 'obj['));
      } else {
        check = eval(`obj.script.data.${ifAttr}`);
      }
    }

    if(check) { // true
      ele.removeAttribute('if');
      return false;
    }

    // false
    ele.remove();
    return true;
  };

  let _loop = (obj, ele) => {
    let output = '';
    let dataName = ele.getAttribute('loop');

    let data = null;
    if(dataName.isString && !dataName.isNumber && !dataName.includes('...')) {
      data = eval(`obj.script.data['${dataName.split('.').join(`']['`)}']`);
    }

    let ifAttribute = ele.hasAttribute('if') ?  `i.${ele.getAttribute('if')}` : true;

    ele.removeAttribute('loop');
    ele.removeAttribute('if');

    let counter = 0;
    let preContainer = document.createElement('div');

    let setLoopData = (d) => {
      let i = d;

      if(eval(ifAttribute)) { // output for looped in an object
        preContainer.innerHTML = ele.outerHTML.replace(/process="[0-9]{8}/g, (m, g) => {
          if(ele.localName === 'component')
            createProps(obj, `${m}-${counter}`.replace('process="', ''), `${dataName}|${dataName}[${counter}]`);
          return `${m}-${counter}`;
        });

       // check the if´s
       let nodeList = preContainer.querySelectorAll('[if]');
       for(let el of nodeList) {
         _if(i, el);
       }

       // replace n or calculation
       preContainer.innerHTML = preContainer.innerHTML.replace(/\{\{(([\d.]+|n?)[\+\-\*\/\% ]+([\d.]+|n)|n)\}\}/g, (m, c) => {
         return eval(c.replace('n', d.isNumber ? d : counter));
       });

       // replace k with object key
       preContainer.innerHTML = preContainer.innerHTML.replace(/\{\{k\}\}/g, m => {
         return Object.keys(data).find(key => data[key] === d);
       });

       // replace data
       preContainer.innerHTML = preContainer.innerHTML.replace(/\{\{([[a-zA-Z0-9\-\.\[\]]+)\}\}/g, (m, c) => {
         return eval(c);
       });

       output += preContainer.innerHTML;
      }

      counter++;
    };

    // create the output with replaced data
    if(data) {
      if(Array.isArray(data)) { // loop array
        for(let i of data) {
          setLoopData(i);
        }
      } else if(data.isObject) { // loop object
        for(let i in data) {
          setLoopData(data[i]);
        }
      }
    } else {
      if(dataName.isNumber) { // loop by number
        for(let n = 0, max = Number(dataName); n < max; n++) {
          setLoopData(n);
        }
      } else if(dataName.isString) {
        let parts = dataName.match(/(\d*)\.{3}(\d*)(\|\d*)?/);
        let start = parts[1].toNumber;
        let end = parts[2].toNumber;
        let step = parts[3].slice(1).toNumber;

        if(start < end)
          for(start, end; start <= end; start+=step) setLoopData(start);
        else
          for(start, end; start >= end; start-=step) setLoopData(start);
      } else {
        ele.remove();
      }
    }

    if(output !== '') {
      ele.insertAdjacentHTML('afterend', output);
      ele.remove();
      return true;
    }

    return false;
  };

  let _ref = (obj, ele, attr) => {
    obj.refs[attr.value] = ele;
    ele.removeAttribute('ref');
  };

  let loopAttributNodes = async (obj, ele) => { // loop all atributes of target element
    let isChanged = false;

    if(ele.attributes.length) {
      for(let attr of [...ele.attributes]) {
        attr.value = await that.replacer.interpreting(attr.value, obj.script.data);
        switch (attr.name) {
          case (attr.name.match(/^:prop/) || {}).input:
            createProps(obj, ele.getAttribute('process'), attr);
            break;
          case 'if':
            isChanged = _if(obj, ele);
            break;
          case 'loop':
            isChanged = _loop(obj, ele);
            break;
          case 'ref':
            _ref(obj, ele, attr);
            break;
        }

        if(isChanged) break;
      }
    }

    return isChanged;
  };

  let loopElementNodes = async (obj) => { // loop al element nodes
    let isChanged = false;

    for(let node of obj.template.getNodeList('element')) {
      // loop all attributes
      if(isChanged = await loopAttributNodes(obj, node)) break;
       if(node.localName === 'component' && !node.rendering) {
        if(node.hasAttribute('continue')) {
          if(node.getAttribute('continue') !== 'true') {
            node.append(that.getLoader());
            node.setAttribute('continue', 'true');
            setTimeout(async function() {
              await that.renderer.digest({
                id: (node.getAttribute('process').match(/^[0-9]+$/) ? node.getAttribute('process').toNumber : node.getAttribute('process')) || null,
                url: node.getAttribute('name'),
                ref: node,
                continue: true,
                type: node.localName,
                parent: obj
              });
            }, 0);
          }
        } else {
          await that.renderer.digest({
            id: (node.getAttribute('process').match(/^[0-9]+$/) ? node.getAttribute('process').toNumber : node.getAttribute('process')) || null,
            url: node.getAttribute('name'),
            ref: node,
            type: node.localName,
            parent: obj
          });
        }
      } else if(!node.process) {
         node.process = obj.id; // add the id from delegated process as a value of html Element
      }
    }

    isChanged && await loopElementNodes(obj);
  };

  return {
    loopElementNodes
  }
}
