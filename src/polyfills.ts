// Polyfills for Chromium 70 compatibility
// Import this file FIRST in main.tsx before any other imports

// Core-JS stable polyfills - comprehensive for Chromium 70
import "core-js/stable";

// Fetch polyfill
import "whatwg-fetch";

// Additional polyfills that may not be in core-js stable yet
import "core-js/stable/promise";
import "core-js/stable/array";
import "core-js/stable/object";
import "core-js/stable/string";
import "core-js/stable/symbol";
import "core-js/stable/symbol/iterator";
import "core-js/stable/symbol/async-iterator";
import "core-js/stable/reflect";
import "core-js/stable/json";
import "core-js/stable/math";
import "core-js/stable/number";
import "core-js/stable/date";

// Polyfill for Object.assign (missing in older browsers)
if (typeof Object.assign !== 'function') {
  Object.assign = function(target: any, ...sources: any[]) {
    if (target === null || target === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];
      if (nextSource !== null && nextSource !== undefined) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Polyfill for Array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement: any, fromIndex?: number) {
      const O = Object(this);
      const len = O.length >>> 0;
      if (len === 0) return false;
      const n = fromIndex | 0;
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    }
  });
}

// Polyfill for String.prototype.includes
if (!String.prototype.includes) {
  String.prototype.includes = function(search: any, position?: number) {
    return String.prototype.indexOf.call(this, search, position) !== -1;
  };
}

// Polyfill for String.prototype.startsWith
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search: any, pos?: number) {
    return this.substr(pos || 0, search.length) === search;
  };
}

// Polyfill for String.prototype.endsWith
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search: any, len?: number) {
    if (len === undefined || len > this.length) {
      len = this.length;
    }
    return this.substring(len - search.length, len) === search;
  };
}

// Polyfill for Object.entries
if (!Object.entries) {
  Object.entries = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resultArray = new Array(i);
    while (i--) {
      resultArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resultArray;
  };
}

// Polyfill for Object.values
if (!Object.values) {
  Object.values = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resultArray = new Array(i);
    while (i--) {
      resultArray[i] = obj[ownProps[i]];
    }
    return resultArray;
  };
}

// Polyfill for NodeList.prototype.forEach
if (typeof NodeList !== 'undefined' && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function(callback: any, thisArg: any) {
    for (let i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Polyfill for Element.prototype.matches
if (!Element.prototype.matches) {
  Element.prototype.matches = (Element.prototype as any).msMatchesSelector || 
    (Element.prototype as any).webkitMatchesSelector;
}

// Polyfill for Element.prototype.closest
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s: any) {
    let el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}


