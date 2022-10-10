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

(function (factory) {
    /* global define, require, module */
    if (typeof define === "function" && define.amd) { // AMD. Register as an anonymous module.
        define(["jquery"], factory);
    } else if (typeof exports === "object") { // Node/CommonJS
        var jQuery = require("jquery");
        module.exports = factory(jQuery);
    } else { // Browser globals (zepto supported)
        factory(window.jQuery || window.Zepto || window.$); // Zepto supported on browsers as well
    }

}(function ($) {
    "use strict";

    var rCRLF = /\r?\n/g;
    var rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i;
    var rsubmittable = /^(?:input|select|textarea|keygen)/i;
    var rcheckableType = /^(?:checkbox|radio)$/i;

    $.fn.serializeJSON = function (options) {
        var f = $.serializeJSON;
        var $form = this; // NOTE: the set of matched elements is most likely a form, but it could also be a group of inputs
        var opts = f.setupOpts(options); // validate options and apply defaults
        var typeFunctions = $.extend({}, opts.defaultTypes, opts.customTypes);

        // Make a list with {name, value, el} for each input element
        var serializedArray = f.serializeArray($form, opts);

        // Convert the serializedArray into a serializedObject with nested keys
        var serializedObject = {};
        $.each(serializedArray, function (_i, obj) {

            var nameSansType = obj.name;
            var type = $(obj.el).attr("data-value-type");

            if (!type && !opts.disableColonTypes) { // try getting the type from the input name
                var p = f.splitType(obj.name); // "foo:string" => ["foo", "string"]
                nameSansType = p[0];
                type = p[1];
            }
            if (type === "skip") {
                return; // ignore fields with type skip
            }
            if (!type) {
                type = opts.defaultType; // "string" by default
            }

            var typedValue = f.applyTypeFunc(obj.name, obj.value, type, obj.el, typeFunctions); // Parse type as string, number, etc.

            if (!typedValue && f.shouldSkipFalsy(obj.name, nameSansType, type, obj.el, opts)) {
                return; // ignore falsy inputs if specified in the options
            }

            var keys = f.splitInputNameIntoKeysArray(nameSansType);
            f.deepSet(serializedObject, keys, typedValue, opts);
        });
        return serializedObject;
    };

    // Use $.serializeJSON as namespace for the auxiliar functions
    // and to define defaults
    $.serializeJSON = {
        defaultOptions: {}, // reassign to override option defaults for all serializeJSON calls

        defaultBaseOptions: { // do not modify, use defaultOptions instead
            checkboxUncheckedValue: undefined, // to include that value for unchecked checkboxes (instead of ignoring them)
            useIntKeysAsArrayIndex: false, // name="foo[2]" value="v" => {foo: [null, null, "v"]}, instead of {foo: ["2": "v"]}

            skipFalsyValuesForTypes: [], // skip serialization of falsy values for listed value types
            skipFalsyValuesForFields: [], // skip serialization of falsy values for listed field names

            disableColonTypes: false, // do not interpret ":type" suffix as a type
            customTypes: {}, // extends defaultTypes
            defaultTypes: {
                "string":  function(str) { return String(str); },
                "number":  function(str) { return Number(str); },
                "boolean": function(str) { var falses = ["false", "null", "undefined", "", "0"]; return falses.indexOf(str) === -1; },
                "null":    function(str) { var falses = ["false", "null", "undefined", "", "0"]; return falses.indexOf(str) === -1 ? str : null; },
                "array":   function(str) { return JSON.parse(str); },
                "object":  function(str) { return JSON.parse(str); },
                "skip":    null // skip is a special type used to ignore fields
            },
            defaultType: "string",
        },

        // Validate and set defaults
        setupOpts: function(options) {
            if (options == null) options = {};
            var f = $.serializeJSON;

            // Validate
            var validOpts = [
                "checkboxUncheckedValue",
                "useIntKeysAsArrayIndex",

                "skipFalsyValuesForTypes",
                "skipFalsyValuesForFields",

                "disableColonTypes",
                "customTypes",
                "defaultTypes",
                "defaultType"
            ];
            for (var opt in options) {
                if (validOpts.indexOf(opt) === -1) {
                    throw new  Error("serializeJSON ERROR: invalid option '" + opt + "'. Please use one of " + validOpts.join(", "));
                }
            }

            // Helper to get options or defaults
            return $.extend({}, f.defaultBaseOptions, f.defaultOptions, options);
        },

        // Just like jQuery's serializeArray method, returns an array of objects with name and value.
        // but also includes the dom element (el) and is handles unchecked checkboxes if the option or data attribute are provided.
        serializeArray: function($form, opts) {
            if (opts == null) { opts = {}; }
            var f = $.serializeJSON;

            return $form.map(function() {
                var elements = $.prop(this, "elements"); // handle propHook "elements" to filter or add form elements
                return elements ? $.makeArray(elements) : this;

            }).filter(function() {
                var $el = $(this);
                var type = this.type;

                // Filter with the standard W3C rules for successful controls: http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2
                return this.name && // must contain a name attribute
                    !$el.is(":disabled") && // must not be disable (use .is(":disabled") so that fieldset[disabled] works)
                    rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && // only serialize submittable fields (and not buttons)
                    (this.checked || !rcheckableType.test(type) || f.getCheckboxUncheckedValue($el, opts) != null); // skip unchecked checkboxes (unless using opts)

            }).map(function(_i, el) {
                var $el = $(this);
                var val = $el.val();
                var type = this.type; // "input", "select", "textarea", "checkbox", etc.

                if (val == null) {
                    return null;
                }

                if (rcheckableType.test(type) && !this.checked) {
                    val = f.getCheckboxUncheckedValue($el, opts);
                }

                if (isArray(val)) {
                    return $.map(val, function(val) {
                        return { name: el.name, value: val.replace(rCRLF, "\r\n"), el: el };
                    } );
                }

                return { name: el.name, value: val.replace(rCRLF, "\r\n"), el: el };

            }).get();
        },

        getCheckboxUncheckedValue: function($el, opts) {
            var val = $el.attr("data-unchecked-value");
            if (val == null) {
                val = opts.checkboxUncheckedValue;
            }
            return val;
        },

        // Parse value with type function
        applyTypeFunc: function(name, strVal, type, el, typeFunctions) {
            var typeFunc = typeFunctions[type];
            if (!typeFunc) { // quick feedback to user if there is a typo or missconfiguration
                throw new Error("serializeJSON ERROR: Invalid type " + type + " found in input name '" + name + "', please use one of " + objectKeys(typeFunctions).join(", "));
            }
            return typeFunc(strVal, el);
        },

        // Splits a field name into the name and the type. Examples:
        //   "foo"           =>  ["foo", ""]
        //   "foo:boolean"   =>  ["foo", "boolean"]
        //   "foo[bar]:null" =>  ["foo[bar]", "null"]
        splitType : function(name) {
            var parts = name.split(":");
            if (parts.length > 1) {
                var t = parts.pop();
                return [parts.join(":"), t];
            } else {
                return [name, ""];
            }
        },

        // Check if this input should be skipped when it has a falsy value,
        // depending on the options to skip values by name or type, and the data-skip-falsy attribute.
        shouldSkipFalsy: function(name, nameSansType, type, el, opts) {
            var skipFromDataAttr = $(el).attr("data-skip-falsy");
            if (skipFromDataAttr != null) {
                return skipFromDataAttr !== "false"; // any value is true, except the string "false"
            }

            var optForFields = opts.skipFalsyValuesForFields;
            if (optForFields && (optForFields.indexOf(nameSansType) !== -1 || optForFields.indexOf(name) !== -1)) {
                return true;
            }

            var optForTypes = opts.skipFalsyValuesForTypes;
            if (optForTypes && optForTypes.indexOf(type) !== -1) {
                return true;
            }

            return false;
        },

        // Split the input name in programatically readable keys.
        // Examples:
        // "foo"              => ["foo"]
        // "[foo]"            => ["foo"]
        // "foo[inn][bar]"    => ["foo", "inn", "bar"]
        // "foo[inn[bar]]"    => ["foo", "inn", "bar"]
        // "foo[inn][arr][0]" => ["foo", "inn", "arr", "0"]
        // "arr[][val]"       => ["arr", "", "val"]
        splitInputNameIntoKeysArray: function(nameWithNoType) {
            var keys = nameWithNoType.split("["); // split string into array
            keys = $.map(keys, function (key) { return key.replace(/\]/g, ""); }); // remove closing brackets
            if (keys[0] === "") { keys.shift(); } // ensure no opening bracket ("[foo][inn]" should be same as "foo[inn]")
            return keys;
        },

        // Set a value in an object or array, using multiple keys to set in a nested object or array.
        // This is the main function of the script, that allows serializeJSON to use nested keys.
        // Examples:
        //
        // deepSet(obj, ["foo"], v)               // obj["foo"] = v
        // deepSet(obj, ["foo", "inn"], v)        // obj["foo"]["inn"] = v // Create the inner obj["foo"] object, if needed
        // deepSet(obj, ["foo", "inn", "123"], v) // obj["foo"]["arr"]["123"] = v //
        //
        // deepSet(obj, ["0"], v)                                   // obj["0"] = v
        // deepSet(arr, ["0"], v, {useIntKeysAsArrayIndex: true})   // arr[0] = v
        // deepSet(arr, [""], v)                                    // arr.push(v)
        // deepSet(obj, ["arr", ""], v)                             // obj["arr"].push(v)
        //
        // arr = [];
        // deepSet(arr, ["", v]          // arr => [v]
        // deepSet(arr, ["", "foo"], v)  // arr => [v, {foo: v}]
        // deepSet(arr, ["", "bar"], v)  // arr => [v, {foo: v, bar: v}]
        // deepSet(arr, ["", "bar"], v)  // arr => [v, {foo: v, bar: v}, {bar: v}]
        //
        deepSet: function (o, keys, value, opts) {
            if (opts == null) { opts = {}; }
            var f = $.serializeJSON;
            if (isUndefined(o)) { throw new Error("ArgumentError: param 'o' expected to be an object or array, found undefined"); }
            if (!keys || keys.length === 0) { throw new Error("ArgumentError: param 'keys' expected to be an array with least one element"); }

            var key = keys[0];

            // Only one key, then it's not a deepSet, just assign the value in the object or add it to the array.
            if (keys.length === 1) {
                if (key === "") { // push values into an array (o must be an array)
                    o.push(value);
                } else {
                    o[key] = value; // keys can be object keys (strings) or array indexes (numbers)
                }
                return;
            }

            var nextKey = keys[1]; // nested key
            var tailKeys = keys.slice(1); // list of all other nested keys (nextKey is first)

            if (key === "") { // push nested objects into an array (o must be an array)
                var lastIdx = o.length - 1;
                var lastVal = o[lastIdx];

                // if the last value is an object or array, and the new key is not set yet
                if (isObject(lastVal) && isUndefined(f.deepGet(lastVal, tailKeys))) {
                    key = lastIdx; // then set the new value as a new attribute of the same object
                } else {
                    key = lastIdx + 1; // otherwise, add a new element in the array
                }
            }

            if (nextKey === "") { // "" is used to push values into the nested array "array[]"
                if (isUndefined(o[key]) || !isArray(o[key])) {
                    o[key] = []; // define (or override) as array to push values
                }
            } else {
                if (opts.useIntKeysAsArrayIndex && isValidArrayIndex(nextKey)) { // if 1, 2, 3 ... then use an array, where nextKey is the index
                    if (isUndefined(o[key]) || !isArray(o[key])) {
                        o[key] = []; // define (or override) as array, to insert values using int keys as array indexes
                    }
                } else { // nextKey is going to be the nested object's attribute
                    if (isUndefined(o[key]) || !isObject(o[key])) {
                        o[key] = {}; // define (or override) as object, to set nested properties
                    }
                }
            }

            // Recursively set the inner object
            f.deepSet(o[key], tailKeys, value, opts);
        },

        deepGet: function (o, keys) {
            var f = $.serializeJSON;
            if (isUndefined(o) || isUndefined(keys) || keys.length === 0 || (!isObject(o) && !isArray(o))) {
                return o;
            }
            var key = keys[0];
            if (key === "") { // "" means next array index (used by deepSet)
                return undefined;
            }
            if (keys.length === 1) {
                return o[key];
            }
            var tailKeys = keys.slice(1);
            return f.deepGet(o[key], tailKeys);
        }
    };

    // polyfill Object.keys to get option keys in IE<9
    var objectKeys = function(obj) {
        if (Object.keys) {
            return Object.keys(obj);
        } else {
            var key, keys = [];
            for (key in obj) { keys.push(key); }
            return keys;
        }
    };

    var isObject =          function(obj) { return obj === Object(obj); }; // true for Objects and Arrays
    var isUndefined =       function(obj) { return obj === void 0; }; // safe check for undefined values
    var isValidArrayIndex = function(val) { return /^[0-9]+$/.test(String(val)); }; // 1,2,3,4 ... are valid array indexes
    var isArray =           Array.isArray || function(obj) { return Object.prototype.toString.call(obj) === "[object Array]"; };
}));