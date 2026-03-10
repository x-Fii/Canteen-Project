/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Object as any).assign = function(target: object, ...sources: unknown[]): object {
    if (target === null || target === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to: Record<string, unknown> = Object(target);
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];
      if (nextSource !== null && nextSource !== undefined) {
        const sourceObj = nextSource as Record<string, unknown>;
        for (const nextKey in sourceObj) {
          if (Object.prototype.hasOwnProperty.call(sourceObj, nextKey)) {
            to[nextKey] = sourceObj[nextKey];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: function(searchElement: unknown, fromIndex?: number): boolean {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  String.prototype.includes = function(search: unknown, position?: number): boolean {
    return String.prototype.indexOf.call(this, search, position) !== -1;
  };
}

// Polyfill for String.prototype.startsWith
if (!String.prototype.startsWith) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  String.prototype.startsWith = function(search: unknown, pos?: number): boolean {
    return this.substr(pos || 0, String(search).length) === search;
  };
}

// Polyfill for String.prototype.endsWith
if (!String.prototype.endsWith) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  String.prototype.endsWith = function(search: unknown, len?: number): boolean {
    if (len === undefined || len > this.length) {
      len = this.length;
    }
    return this.substring(len - String(search).length, len) === search;
  };
}

// Polyfill for Object.entries
if (!Object.entries) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries = function(obj: object): [string, unknown][] {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resultArray: [string, unknown][] = new Array(i);
    while (i--) {
      resultArray[i] = [ownProps[i], (obj as Record<string, unknown>)[ownProps[i]]];
    }
    return resultArray;
  };
}

// Polyfill for Object.values
if (!Object.values) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values = function(obj: object): unknown[] {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resultArray: unknown[] = new Array(i);
    while (i--) {
      resultArray[i] = (obj as Record<string, unknown>)[ownProps[i]];
    }
    return resultArray;
  };
}

// Polyfill for NodeList.prototype.forEach
if (typeof NodeList !== 'undefined' && !NodeList.prototype.forEach) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NodeList.prototype.forEach = function(callback: (this: unknown, node: Node, index: number, list: NodeList) => void, thisArg?: unknown): void {
    for (let i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Polyfill for Element.prototype.matches
if (!Element.prototype.matches) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).matches = (Element.prototype as any).msMatchesSelector || 
    (Element.prototype as any).webkitMatchesSelector;
}

// Polyfill for Element.prototype.closest
if (!Element.prototype.closest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Element.prototype.closest = function(s: string): Element | null {
    let el: Element | null = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement;
    } while (el !== null);
    return null;
  };
}


