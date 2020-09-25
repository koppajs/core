export default function renderer(that) {
  let extraktScript = async (source, scopedData) => {
    source = source.match(/<script>([^⹇]*)<\/script>/);
    source = !source ? 'data: {}' : source[1].trim();
    // create script object
    let script = eval(`(async function(${scopedData.args}) {
      let renderer, extraktScript, source, scopedData;

      return { ${source} };
    } );`);

    return await script();
  };

  let _renderer = that => {
    let getScopedData = (obj) => {
      let scope = that.scope;
      let args = '';

      scope['refs'] = obj.refs;

      for(let i in scope) {
        args += `, ${i} = scopedData.${i}`;
      }

      scope['args'] = args.replace(/^, /, '');

      return scope;
    };

    let getReference = (selector) => { // no selector
      if(!selector) {
        selector = that.settings.general.appContainer;
      }

      if(selector.isString) { // selector is string
        selector = document.querySelector(selector);
      }

      if(selector.isElement) { // element exists
        return selector;
      }

       // element not exists
      console.error(`Renderer: can´t find the referenced Element in DOM!`);
      return null;
    };

    let getSource = async (obj) => {
      if(obj.url) {
        if(obj.type === 'component') {
          obj.url = obj.url.includes('/') ? `${obj.url}` : `./components/${obj.url}`
        }

        let response = await that.caller.get({ url: obj.url, save: true });

        if(response.ok) {
          return response.content;
        } else {
          console.error(`${obj.type} "${obj.url}" not found! - ${response.status}`);
        }
      } else {
        if(obj.type === 'page')
          console.error(`${obj.type} have no Route!`);
        else {
          console.error(`${obj.type} "${obj.ref.getAttribute('name')}" have no Route!`);
        }
      }
    };

    let modifySource = (source) => {
      for(let i of that.componentProvider.names()) {
         source = source.replace(new RegExp(`<(${i})|<\/(${i})`, 'g'), (m, g) => {
           if(m.match(/^<\//)) {
             return `</component`;
           }
           return `<component name="${g}"`;
         });
      }

      for(let i of source.match(/process=("|')([\d\-\w]+)("|')/g) || []) {
        that.getId(i.match(/("|')([^⹇]*)("|')/)[2]);
      }

      return source.replace(/<[^/]?\s*(component)\s*[^>]*>/g, (m, g) => {
        let propCounter = -1;
        return m.replace(g, `${g} process="${that.getId()}"`)
                .replace(/:([\w]{1}[\w\d-]*)="/g, (m, g) => {
                  propCounter++;
                  return `:prop-${propCounter}="${g}|`;
                });
      })
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '') // remove js comments
      .replace(/<!--(.*?)-->/gm, '') // remove html comments
      .replace(/(?!<\")\/\*[^\*]+\*\/(?!\")/gm, ''); // remove css comments
    };

    let extraktTemplate = async (obj) => {
      let tplString = obj.source.match(/<template>([^⹇]*)<\/template>/) ? obj.source.match(/<template>([^⹇]*)<\/template>/)[1].trim() : null;
      let template = document.createElement('div');
      if(tplString === null) {
        console.error(`Source was not found "${obj.url}"`);
      } else {
        // runn the item injecting
        if(obj.isChildren && obj.parent.childItems && obj.parent.childItems[obj.id]) {
          tplString = tplString.replace(/::\[([0-9]+)\]::/gm, (m, g) => {
            return obj.parent.childItems[obj.id][g];
          });
        }

        template.innerHTML = await that.replacer.interpreting(tplString);
      }
      return template;
    };

    let extraktStyle = async (source, id) => {
      let style = source.match(/<style[^⹇]*<\/style>/gi);
      return style ? `<style process="${id.toString().split('-')[0]}">${await that.replacer.interpreting(style[0].replace(/(<style[^<>]*(scope="([a-zA-Z]+[\w\d-]*)")[^<>]*|<style[^<>]*)>([^<]*)<\/style>/g, (m, c0, scopeAttribute, scope, css) => { return scope ? css.trim().replace(/[^}]*{/g, m => { return ` .${scope} ${m.trim()}`; }) : css; }))}</style>` : ''; };

    let buildComputedData = (script) => {
      for(let i in script.comp?.isObject ? script.comp : {}) {
        script.data[i] = script.comp[i].isFunction
                       ? script.comp[i].call(script.data)
                       : script.comp[i];
      }

      script.comp = undefined;
      delete script.comp;
    };

    let bindStepMethods = (script) => { // bind data to process step methods
      if(script.pre && script.pre.isFunction)
        script.pre = script.pre.bind(script.data);

      if(script.created && script.created.isFunction)
        script.created = script.created.bind(script.data);

      if(script.merged && script.merged.isFunction)
        script.merged = script.merged.bind(script.data);
    };

    let bindScriptPropsMethods = (script) => {
      // bind data to script methods
      for(let i in script.props?.isObject ? script.props : {}) {
        if(script.props[i].isFunction) {
          script.props[i] = script.props[i].bind(script.data);
        }
      }
    };

    let bindScriptMethods = (script) => {
      // bind data to script methods
      for(let i in script.methods?.isObject ? script.methods : {}) {
        if(script.methods[i].isFunction) {
          script.data[i] = script.methods[i].bind(script.data);
        }
      }

      script.methods = undefined;
      delete script.methods;
    };

    let buildEventListeners = async (obj) => {
      let selectors, selector, nodes, node, e;

      for(e of obj.script.events) {
        selectors = e[0].split(',');
        nodes = [];

        for(selector of selectors) {
          selector.replace(/^ *(refs\.[a-zA-z]{1}[\w-]*)?([\w-\.\[\]="':# ]+)?$/, (m, c1, c2) => {
            if(c1 && !c2) { // only ref selecting
              obj.refs && nodes.push(eval(`obj.${c1}`));
            } else if(!c1 && c2) { // only normal selector selecting
              nodes = nodes.concat([...obj.template.querySelectorAll(c2)]);
            } else if(c1 && c2) { // ref and normal selector selecting
              nodes = nodes.concat([...eval(`obj.${c1}`).querySelectorAll(c2)]);
            }
          });
        }

        for(node of nodes) {
          node.addEventListener(e[1], e[2].bind(obj.script.data));
        }
      }
    };

    let bindWatchingMethods = (script) => {
      // bind data to script methods
      for(let i in script.watching?.isObject ? script.watching : {})
        script.watching[i].isFunction && (script.watching[i] = script.watching[i].bind(script.data));
    };

    let injectProps = (obj) => {
      let rootProcess, rootDataName;
      if(obj.isChildren && obj.parent.childProps) { // onli childs
        for(let i in obj.parent.childProps[obj.id]?.isObject ? obj.parent.childProps[obj.id] : {}) {
          if(obj.parent.childProps[obj.id][i].isObject) {
            if(obj.script.props && obj.script.props[i] && obj.script.props[i].isFunction) {
              obj.script.data[i] = obj.script.props[i](obj.parent.childProps[obj.id][i].val);
            } else {
              obj.script.data[i] = obj.parent.childProps[obj.id][i].val;
            }
          } else {
            if(obj.script.props && obj.script.props && obj.script.props[i] && obj.script.props[i].isFunction) {
              obj.script.data[i] = obj.script.props[i](obj.parent.childProps[obj.id][i]);
            } else {
              obj.script.data[i] = obj.parent.childProps[obj.id][i];
            }
          }

          obj.script.data.watch(i, (name, oldVal, newVal) => {
            if(oldVal !== newVal) { // when value is changed
              if(obj.parent.childProps[obj.id][i].isObject) {
                rootProcess = obj.parent.childProps[obj.id][i].process;
                rootDataName = obj.parent.childProps[obj.id][i].name;

                if(rootProcess.script.data[rootDataName] !== newVal) {
                  rootProcess.script.data[rootDataName] = newVal;
                  if(!rootProcess.isRendering && rootProcess.isActive) {
                    digest(rootProcess);
                  }
                }
              } else {
                if(!obj.isRendering && obj.isActive) {
                  digest(obj);
                }
              }
            }
            return newVal;
          });
        }

        for(let i in obj.props?.isObject ? obj.props : {}) {
          if(obj.script.props && obj.script.props[i] && obj.script.props[i].isFunction) {
            obj.script.data[i] = obj.script.props[i](obj.props[i]);
          } else {
            obj.script.data[i] = obj.props[i];
          }
        }
      }
    };

    let setWatcher = (obj) => { // set watchers for data of current process
      for(let i in obj.script.watching?.isObject ? obj.script.watching : {}) {
        if(obj.script.data[i]) {
          obj.script.data.watch(i, (name, oldVal, newVal) => {
            if(oldVal !== newVal) { // when value is changed
              if(!obj.isRendering && obj.isActive) {
                digest(obj);
              }
            }
            return newVal;
          });
        }
      }
    };

    let create = async (obj) => { // create a new Process if it´s not exists
      // setup id
      !obj.id && (obj.id = obj.ref.process || obj.ref.getAttribute('process') || that.getId());

      obj.isChildren = !!obj.parent;
      obj.isPrime = !obj.parent;
      !obj.isActive && (obj.isActive = false);

      that.processes[obj.id] = obj;
      obj.type === 'page' && (that.processes[obj.url] = that.processes[obj.id]);

      obj.isChildren && (obj.parent.children[obj.id] = obj);

      obj.source = await getSource(obj);
      obj.source = modifySource(obj.source);

      await build(obj);
    };

    let reCreate = async (obj) => { // create the Process based on existing Process
      that.processes[obj.id].ref = obj.ref;
      await build(that.processes[obj.id]);
    };

    let build = async (obj) => { // build the process if its not buildet exists
      let oldData;
      obj.refs = {};

      obj.template = await extraktTemplate(obj);
      obj.style = await extraktStyle(obj.source, obj.id);

      if(obj.script) {
        oldData = obj.script.data;
        obj.script = await extraktScript(obj.source, getScopedData(obj));
        obj.script.data = oldData;
      } else {
        obj.script = await extraktScript(obj.source, getScopedData(obj));
      }

      bindScriptPropsMethods(obj.script);

      injectProps(obj);

      buildComputedData(obj.script);

      // Binding Data as that
      bindStepMethods(obj.script);
      bindScriptMethods(obj.script);

      // set watchings
      bindWatchingMethods(obj.script);
      setWatcher(obj);

      // runn beforeStack
      if(obj.type === 'page') {
        for(let f of that.beforeStack) {
          f(obj.script.data);
        }
      }

      if(obj.script.pre) {
        if(obj.script.pre.isAsync) {
          await obj.script.pre();
        } else {
          obj.script.pre();
        }
      }

      if(obj.stop === false) {
        await compile(obj);
      } else {
        obj.stop = false;
      }
    };

    let extraktItems = async (obj) => { // extrakt the component delegated items
      let items;
      for(let c of obj.template.querySelectorAll('component')) {
        items = [];
        for(let i of c.querySelectorAll('item')) {
          items.push(i.innerHTML.trim());
        }

        !obj.childItems && (obj.childItems = {})

        if(items.length) {
          obj.childItems[c.getAttribute('process')] = items;
        }

        c.innerHTML = '';
      }
    };

    let compile = async (obj) => { // compile process
      // runn the data replacing process
      await that.replacer.interpreting(obj.template, obj.script.data);

      await extraktItems(obj);

      // handling all Element-Nodes of the Template
      await that.nodePlayer.loopElementNodes(obj);

      if(obj.script.created) {
        if(obj.script.created.isAsync) {
          await obj.script.created();
        } else {
          obj.script.created();
        }
      }

      obj.script.events && await buildEventListeners(obj);

      await merge(obj);
    };

    let merge = async (obj) => { // merge process in ref process
      let oldPage, newRef, reRendered = false;

      // insert Style in Document head
      if(!document.head.querySelector(`style[process="${obj.id.toString().split('-')[0]}"]`)) {
        document.head.append(obj.style);
      }

      if(obj.ref.process === obj.id) {
        reRendered = true;
      }

      // insert in or replace with the Object Reference Element
      switch(obj.type) {
        case 'page':
          oldPage = obj.ref.querySelector('[data-type="page"]');
          obj.template.firstElementChild.dataset.type = 'page';

          if(oldPage) {
            destroy(oldPage.process, (oldPage.process != obj.id));
            oldPage.replaceWith(obj.template.firstElementChild);
          } else {
            obj.ref.append(obj.template.firstElementChild);
          }
          break;

        case 'component':
          newRef = obj.template.firstElementChild;
          if(newRef) {
            newRef.dataset.type = 'component';

            if(obj.ref.localName === 'component' || obj.ref.dataset.type === 'component') {
              obj.ref.replaceWith(newRef);
            } else {
              obj.ref.append(newRef);
            }

            obj.ref = newRef;
          }
          break;
      }

      obj.isActive = true;
      if(obj.script.merged) {
        if(obj.script.merged.isAsync) {
          await obj.script.merged();
        } else {
          obj.script.merged();
        }
      }

      // runn afterStack
      if(obj.type === 'page' || reRendered === true || obj.continue === true) {
        for(let f of that.afterStack) {
          f(obj.script.data);
        }
      }

      obj.isRendering = false;
    };

    let destroy = (id, hard = true) => {
      for(let i in that.processes[id].children) {
        destroy(that.processes[id].children[i].id, hard);
      }

      if(hard) {
        that.processes[that.processes[id].url] && (that.processes[that.processes[id].url].isActive = false);
        that.processes[id].isActive = false;
        delete that.processes[that.processes[id].url];
        delete that.processes[id];

        let style = document.querySelector(`style[process|="${id.toString().split('-')[0]}"]`);
        style && style.parentNode.removeChild(style);
      }
    };

    let stop = (obj) => {
      obj.stop = true;
      obj.isRendering = false;
      obj.isActive = false;
    };

    let digest = async obj => {
      if(obj.isString) obj = { url: obj };

      obj.ref = getReference(obj.ref);
      !obj.url && (obj.url = null);
      !obj.type && (obj.type = 'page');
      !obj.parent && (obj.parent = null);
      !obj.children && (obj.children = {});
      !obj.continue && (obj.continue = false);
      !obj.isRendering && (obj.isRendering = true);
      obj.stop = false;

      that.scope.digest = (o) => { digest(o || obj); };
      that.scope.stop = () => { stop(obj); };

      if(obj.type === 'component') {
        obj.url = that.componentProvider.get(obj.url);
      }

      if(!that.processes[obj.id] && !that.processes[obj.url]) { // create new Process
        await create(obj);
      } else if(obj.type !== 'page') { // component
        if(obj.ref.children.length > 0) {
          if(obj.continue) {
            await create(obj);
          } else {
            await reCreate(obj);
          }
        } else {
          await reCreate(obj);
        }
      } else {
        await reCreate(that.processes[obj.url]);
      }

      return obj.id;
    };

    return {
      digest,
      destroy
    };
  };

  return _renderer(that);
}
