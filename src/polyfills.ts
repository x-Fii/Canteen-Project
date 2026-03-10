// Polyfills for older browser support (Chromium 87)
// Import this file FIRST in main.tsx before any other imports

// Core-JS polyfills - import only what's needed for Chromium 87
import "core-js/stable";
import "core-js/stable/promise";
import "core-js/stable/array";
import "core-js/stable/object";
import "core-js/stable/string";
import "core-js/stable/reflect";

// Fetch polyfill (Firebase may need this in older browsers)
import "whatwg-fetch";

// Symbol polyfill for older browsers
import "core-js/stable/symbol";
import "core-js/stable/symbol/iterator";
import "core-js/stable/symbol/async-iterator";

