// Author: Wael Houry - ⌐■‿■
window.$$ = document.querySelectorAll.bind(document);

window.$ = document.querySelector.bind(document);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
}

Object.setPrototypeOf(NodeList.prototype, Array.prototype)

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function(obj, proto) {
    obj.__proto__ = proto;
    return obj; 
  }
}

Node.prototype.on = window.on = function(names, fn) {
  var self = this

  names.split(' ').forEach(function(name) {
    self.addEventListener(name, fn)
  })

  return this
}

NodeList.prototype.on = NodeList.prototype.addEventListener = function(names, fn) {
  this.forEach(function(elem) {
    elem.on(names, fn)
  })

  return this
}


Element.prototype.css = function(a,i,n){for(n in''+a===a||a)this.style[n]=a[n];return i||n?(this.style[a]=i,this):getComputedStyle(this)[a]}


class FlexMiddle extends HTMLElement {
    constructor() {
      super();
      // element created
    }
  
    connectedCallback() {
      // browser calls this method when the element is added to the document
      // (can be called many times if an element is repeatedly added/removed)
      this.css({display:'flex', 'align-items': 'center', 'justify-content': 'center', width: '100%', height: '100%'})
    }
  
    disconnectedCallback() {
      // browser calls this method when the element is removed from the document
      // (can be called many times if an element is repeatedly added/removed)
    }
  
    static get observedAttributes() {
      return [/* array of attribute names to monitor for changes */];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      // called when one of attributes listed above is modified
    }
  
    adoptedCallback() {
      // called when the element is moved to a new document
      // (happens in document.adoptNode, very rarely used)
    }
  
    // there can be other element methods and properties
  }
  customElements.define("flex-middle", FlexMiddle);



  //promises

  /*
 *  Copyright 2012-2013 (c) Pierre Duquesne 
 */

(function(exports) {

  function Promise() {
      this._callbacks = [];
  }

  Promise.prototype.then = function(func, context) {
      var p;
      if (this._isdone) {
          p = func.apply(context, this.result);
      } else {
          p = new Promise();
          this._callbacks.push(function () {
              var res = func.apply(context, arguments);
              if (res && typeof res.then === 'function')
                  res.then(p.done, p);
          });
      }
      return p;
  };

  Promise.prototype.done = function() {
      this.result = arguments;
      this._isdone = true;
      for (var i = 0; i < this._callbacks.length; i++) {
          this._callbacks[i].apply(null, arguments);
      }
      this._callbacks = [];
  };

  function join(promises) {
      var p = new Promise();
      var results = [];

      if (!promises || !promises.length) {
          p.done(results);
          return p;
      }

      var numdone = 0;
      var total = promises.length;

      function notifier(i) {
          return function() {
              numdone += 1;
              results[i] = Array.prototype.slice.call(arguments);
              if (numdone === total) {
                  p.done(results);
              }
          };
      }

      for (var i = 0; i < total; i++) {
          promises[i].then(notifier(i));
      }

      return p;
  }

  function chain(funcs, args) {
      var p = new Promise();
      if (funcs.length === 0) {
          p.done.apply(p, args);
      } else {
          funcs[0].apply(null, args).then(function() {
              funcs.splice(0, 1);
              chain(funcs, arguments).then(function() {
                  p.done.apply(p, arguments);
              });
          });
      }
      return p;
  }

  /*
   * AJAX requests
   */
  
  function _encode(data) {
      var payload = "";
      if (typeof data === "string") {
          payload = data;
      } else {
          var e = encodeURIComponent;
          var params = [];

          for (var k in data) {
              if (data.hasOwnProperty(k)) {
                  params.push(e(k) + '=' + e(data[k]));
              }
          }
          payload = params.join('&')
      }
      return payload;
  }

  function new_xhr() {
      var xhr;
      if (window.XMLHttpRequest) {
          xhr = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
          try {
              xhr = new ActiveXObject("Msxml2.XMLHTTP");
          } catch (e) {
              xhr = new ActiveXObject("Microsoft.XMLHTTP");
          }
      }
      return xhr;
  }


  function ajax(method, url, data, headers) {
      var p = new Promise();
      var xhr, payload;
      data = data || {};
      headers = headers || {};

      try {
          xhr = new_xhr();
      } catch (e) {
          p.done(promise.ENOXHR, "");
          return p;
      }

      payload = _encode(data);
      if (method === 'GET' && payload) {
          url += '?' + payload;
          payload = null;
      }

      xhr.open(method, url);

      var content_type = 'application/x-www-form-urlencoded';
      for (var h in headers) {
          if (headers.hasOwnProperty(h)) {
              if (h.toLowerCase() === 'content-type')
                  content_type = headers[h];
              else
                  xhr.setRequestHeader(h, headers[h]);
          }
      }
      xhr.setRequestHeader('Content-type', content_type);


      function onTimeout() {
          xhr.abort();
          p.done(promise.ETIMEOUT, "", xhr);
      }

      var timeout = promise.ajaxTimeout;
      if (timeout) {
          var tid = setTimeout(onTimeout, timeout);
      }

      xhr.onreadystatechange = function() {
          if (timeout) {
              clearTimeout(tid);
          }
          if (xhr.readyState === 4) {
              var err = (!xhr.status ||
                         (xhr.status < 200 || xhr.status >= 300) &&
                         xhr.status !== 304);
              p.done(err, xhr.responseText, xhr);
          }
      };

      xhr.send(payload);
      return p;
  }

  function _ajaxer(method) {
      return function(url, data, headers) {
          return ajax(method, url, data, headers);
      };
  }

  var promise = {
      Promise: Promise,
      join: join,
      chain: chain,
      ajax: ajax,
      get: _ajaxer('GET'),
      post: _ajaxer('POST'),
      put: _ajaxer('PUT'),
      del: _ajaxer('DELETE'),

      /* Error codes */
      ENOXHR: 1,
      ETIMEOUT: 2,

      /**
       * Configuration parameter: time in milliseconds after which a
       * pending AJAX request is considered unresponsive and is
       * aborted. Useful to deal with bad connectivity (e.g. on a
       * mobile network). A 0 value disables AJAX timeouts.
       *
       * Aborted requests resolve the promise with a ETIMEOUT error
       * code.
       */
      ajaxTimeout: 0
  };

  if (typeof define === 'function' && define.amd) {
      /* AMD support */
      define(function() {
          return promise;
      });
  } else {
      exports.promise = promise;
  }

})(this);

// serializeJson
Element.prototype.serializeJson = function wael(){var e={},t=[];if("function"==typeof HTMLFormElement&&this instanceof HTMLFormElement)for(var n in this.elements)(this.elements[n]instanceof HTMLInputElement||this.elements[n]instanceof HTMLSelectElement||this.elements[n]instanceof HTMLTextAreaElement)&&t.push({name:this.elements[n].name,value:this.elements[n].value});else Array.isArray(this)&&(t=this);return t.reduce(function(e,t){var n=e,i=t.name.split(".");return i.forEach((e,s)=>{var r=e.replace(/\[[0-9]*\]$/,"");if(n.hasOwnProperty(r)||(n[r]=RegExp("[[0-9]*]$").test(e)?[]:{}),!(n[r]instanceof Array))return s===i.length-1?n[r]=t.value:n=n[r];var a=parseInt((e.match(RegExp("([0-9]+)]$"))||[]).pop(),10);if(a=isNaN(a)?n[r].length:a,n[r][a]=n[r][a]||{},s!==i.length-1)return n=n[r][a];if(JSON.stringify({})!==JSON.stringify(n[r][a]))for(;void 0!==n[r][a];){var l=n[r][a];n[r][a]=t.value,t.value=l,a++}return n[r][a]=t.value}),e},{})}
