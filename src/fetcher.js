const fetcher = () => {
  const responseStore = {};
  const maxNumberOfRetrys = 1;

  const fetchHandler = async (url, obj) => {
    const response = (await (fetch(url, obj)
      .then((resp) => resp)
      .catch((error) => {
        let status = 500;
        let statusText = 'Internal Server Error';

        switch (error.toString()) {
        case 'Unauthorized':
          status = 401;
          statusText = 'Unauthorized';
          break;
        case 'Not Found':
          status = 404;
          statusText = 'Not Found';
          break;
        default:
          status = 500;
          statusText = 'Internal Server Error';
        }

        return {
          body: null,
          bodyUsed: false,
          content: null,
          headers: {},
          ok: false,
          redirected: false,
          status,
          statusText,
          type: 'basic',
          url
        };
      })
    ));
    return response;
  };

  const getResponse = async (url, obj) => { // find response in the responseStore
    let responseUrl = url.replace(/^\/|\.\//, `${window.location.origin}/`);

    if (!responseUrl.includes(window.location.origin) && !/^((http|https|ftp):\/\/)/.test(responseUrl)) {
      responseUrl = `${window.location.origin}/${responseUrl}`;
    }

    obj.credentials = !responseUrl.match(new RegExp(window.location.origin, 'ig')) ? 'same-origin' : 'include';

    let ret = responseStore[responseUrl];

    if (!responseStore[responseUrl]) ret = await fetchHandler(url, obj);

    return ret;
  };

  const request = async (obj, tryCounter = 0) => {
    if (!obj.headers) obj.headers = {};

    obj.mode = 'cors';
    obj.cache = 'default';

    tryCounter += 1;

    if (obj.method !== 'GET') {
      obj.headers['Content-Type'] = obj.data.isObject ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
      obj.body = JSON.stringify(obj.data);
    }

    const response = await getResponse(obj.url, obj);

    if (response?.ok) {
      if (!response.content) response.content = await response.text();

      if (obj && obj.isObject && obj.save && !responseStore[response.url]) { responseStore[response.url] = response; }
    } else if (tryCounter < maxNumberOfRetrys) {
      const req = await request(obj, tryCounter);
      return req;
    }

    return response;
  };

  return {
    get: async (obj) => {
      if (obj.isString) {
        obj = {
          url: obj
        };
      }

      obj.method = 'GET';
      const response = await request(obj);
      return response;
    },
    post: async (obj) => {
      obj.method = 'POST';
      const response = await request(obj);
      return response;
    },
    put: async (obj) => {
      obj.method = 'PUT';
      const response = await request(obj);
      return response;
    },
    delete: async (obj) => {
      obj.method = 'DELETE';
      const response = await request(obj);
      return response;
    }
  };
};

export default fetcher;
