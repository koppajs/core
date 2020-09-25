export default function caller(that, config) {
  let responseStore = {};

  let getResponse = async (url, obj) => { // find response in the responseStore
    let responseUrl = url.replace(/^\/|\.\//, location.origin+'/');

    if(!responseUrl.includes(location.origin) && !/^((http|https|ftp):\/\/)/.test(responseUrl)) {
      responseUrl = `${location.origin}/${responseUrl}`;
    }

    if(!responseUrl.match(new RegExp(location.origin, 'ig'))) {
      obj.credentials = 'include';
    } else {
      obj.credentials = 'same-origin';
    }

    return responseStore[responseUrl] || await fetch(url, obj);
  };

  let request = async (obj = {}, tryCounter = 0) => {
    let url = obj.isString ? obj : obj.url, response,
        requestObj = {
          method: obj.method || 'GET',
          headers: obj.headers || {},
          mode: 'cors',
          cache: 'default'
        };

    tryCounter++;

    if(requestObj.method === 'POST') { // its a post request
      requestObj.headers['Content-Type'] = obj.data.isObject ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
      requestObj['body'] = JSON.stringify(obj.data);
    }

    response = await getResponse(url, requestObj);

    if(response.ok) {
      !response.content && (response.content = await response.text());

      if(obj && obj.isObject && obj.save && !responseStore[response.url]) responseStore[response.url] = response;
      // TODO: implement the POST correct
    } else {
      if(tryCounter <= config.maxRequestTry) {
        console.warn(`Caller: "${url}" request failed, try ${tryCounter}`);
        //obj = obj ? obj : url;
        return await request(obj, tryCounter);
      } else {
        console.error(`Caller[${url}]:  ${response.status}`);
      }
    }

    return response;
  };

  let get = async (obj) => {
    let response = await request(obj);
    return response;
  };

  let post = async (obj) => {
    obj.method = 'POST';
    let response = await request(obj);
    return response;
  };

  // TODO:
  // create a preeloading caller process
  // create a combined file loading multiple files in one file

  return {
    get,
    post
  };
}
