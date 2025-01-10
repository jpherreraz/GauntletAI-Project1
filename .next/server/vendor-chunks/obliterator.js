/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/obliterator";
exports.ids = ["vendor-chunks/obliterator"];
exports.modules = {

/***/ "(ssr)/./node_modules/obliterator/foreach.js":
/*!*********************************************!*\
  !*** ./node_modules/obliterator/foreach.js ***!
  \*********************************************/
/***/ ((module) => {

eval("/**\n * Obliterator ForEach Function\n * =============================\n *\n * Helper function used to easily iterate over mixed values.\n */\n\n/**\n * Constants.\n */\nvar ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== 'undefined',\n    SYMBOL_SUPPORT = typeof Symbol !== 'undefined';\n\n/**\n * Function able to iterate over almost any iterable JS value.\n *\n * @param  {any}      iterable - Iterable value.\n * @param  {function} callback - Callback function.\n */\nfunction forEach(iterable, callback) {\n  var iterator, k, i, l, s;\n\n  if (!iterable)\n    throw new Error('obliterator/forEach: invalid iterable.');\n\n  if (typeof callback !== 'function')\n    throw new Error('obliterator/forEach: expecting a callback.');\n\n  // The target is an array or a string or function arguments\n  if (\n    Array.isArray(iterable) ||\n    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||\n    typeof iterable === 'string' ||\n    iterable.toString() === '[object Arguments]'\n  ) {\n    for (i = 0, l = iterable.length; i < l; i++)\n      callback(iterable[i], i);\n    return;\n  }\n\n  // The target has a #.forEach method\n  if (typeof iterable.forEach === 'function') {\n    iterable.forEach(callback);\n    return;\n  }\n\n  // The target is iterable\n  if (\n    SYMBOL_SUPPORT &&\n    Symbol.iterator in iterable &&\n    typeof iterable.next !== 'function'\n  ) {\n    iterable = iterable[Symbol.iterator]();\n  }\n\n  // The target is an iterator\n  if (typeof iterable.next === 'function') {\n    iterator = iterable;\n    i = 0;\n\n    while ((s = iterator.next(), s.done !== true)) {\n      callback(s.value, i);\n      i++;\n    }\n\n    return;\n  }\n\n  // The target is a plain object\n  for (k in iterable) {\n    if (iterable.hasOwnProperty(k)) {\n      callback(iterable[k], k);\n    }\n  }\n\n  return;\n}\n\n/**\n * Same function as the above `forEach` but will yield `null` when the target\n * does not have keys.\n *\n * @param  {any}      iterable - Iterable value.\n * @param  {function} callback - Callback function.\n */\nforEach.forEachWithNullKeys = function(iterable, callback) {\n  var iterator, k, i, l, s;\n\n  if (!iterable)\n    throw new Error('obliterator/forEachWithNullKeys: invalid iterable.');\n\n  if (typeof callback !== 'function')\n    throw new Error('obliterator/forEachWithNullKeys: expecting a callback.');\n\n  // The target is an array or a string or function arguments\n  if (\n    Array.isArray(iterable) ||\n    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||\n    typeof iterable === 'string' ||\n    iterable.toString() === '[object Arguments]'\n  ) {\n    for (i = 0, l = iterable.length; i < l; i++)\n      callback(iterable[i], null);\n    return;\n  }\n\n  // The target is a Set\n  if (iterable instanceof Set) {\n    iterable.forEach(function(value) {\n      callback(value, null);\n    });\n    return;\n  }\n\n  // The target has a #.forEach method\n  if (typeof iterable.forEach === 'function') {\n    iterable.forEach(callback);\n    return;\n  }\n\n  // The target is iterable\n  if (\n    SYMBOL_SUPPORT &&\n    Symbol.iterator in iterable &&\n    typeof iterable.next !== 'function'\n  ) {\n    iterable = iterable[Symbol.iterator]();\n  }\n\n  // The target is an iterator\n  if (typeof iterable.next === 'function') {\n    iterator = iterable;\n    i = 0;\n\n    while ((s = iterator.next(), s.done !== true)) {\n      callback(s.value, null);\n      i++;\n    }\n\n    return;\n  }\n\n  // The target is a plain object\n  for (k in iterable) {\n    if (iterable.hasOwnProperty(k)) {\n      callback(iterable[k], k);\n    }\n  }\n\n  return;\n};\n\n/**\n * Exporting.\n */\nmodule.exports = forEach;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvb2JsaXRlcmF0b3IvZm9yZWFjaC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFVBQVU7QUFDdEIsWUFBWSxVQUFVO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsT0FBTztBQUM1QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFVBQVU7QUFDdEIsWUFBWSxVQUFVO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsT0FBTztBQUM1QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxqdWFucFxcR2F1bnRsZXRBSVxcUHJvamVjdCAxXFxub2RlX21vZHVsZXNcXG9ibGl0ZXJhdG9yXFxmb3JlYWNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2JsaXRlcmF0b3IgRm9yRWFjaCBGdW5jdGlvblxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdXNlZCB0byBlYXNpbHkgaXRlcmF0ZSBvdmVyIG1peGVkIHZhbHVlcy5cbiAqL1xuXG4vKipcbiAqIENvbnN0YW50cy5cbiAqL1xudmFyIEFSUkFZX0JVRkZFUl9TVVBQT1JUID0gdHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyxcbiAgICBTWU1CT0xfU1VQUE9SVCA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcbiAqIEZ1bmN0aW9uIGFibGUgdG8gaXRlcmF0ZSBvdmVyIGFsbW9zdCBhbnkgaXRlcmFibGUgSlMgdmFsdWUuXG4gKlxuICogQHBhcmFtICB7YW55fSAgICAgIGl0ZXJhYmxlIC0gSXRlcmFibGUgdmFsdWUuXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaChpdGVyYWJsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGl0ZXJhdG9yLCBrLCBpLCBsLCBzO1xuXG4gIGlmICghaXRlcmFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoOiBpbnZhbGlkIGl0ZXJhYmxlLicpO1xuXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoOiBleHBlY3RpbmcgYSBjYWxsYmFjay4nKTtcblxuICAvLyBUaGUgdGFyZ2V0IGlzIGFuIGFycmF5IG9yIGEgc3RyaW5nIG9yIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICBpZiAoXG4gICAgQXJyYXkuaXNBcnJheShpdGVyYWJsZSkgfHxcbiAgICAoQVJSQVlfQlVGRkVSX1NVUFBPUlQgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KGl0ZXJhYmxlKSkgfHxcbiAgICB0eXBlb2YgaXRlcmFibGUgPT09ICdzdHJpbmcnIHx8XG4gICAgaXRlcmFibGUudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSdcbiAgKSB7XG4gICAgZm9yIChpID0gMCwgbCA9IGl0ZXJhYmxlLmxlbmd0aDsgaSA8IGw7IGkrKylcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2ldLCBpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGhhcyBhICMuZm9yRWFjaCBtZXRob2RcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5mb3JFYWNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmFibGUuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBpdGVyYWJsZVxuICBpZiAoXG4gICAgU1lNQk9MX1NVUFBPUlQgJiZcbiAgICBTeW1ib2wuaXRlcmF0b3IgaW4gaXRlcmFibGUgJiZcbiAgICB0eXBlb2YgaXRlcmFibGUubmV4dCAhPT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICBpdGVyYWJsZSA9IGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIC8vIFRoZSB0YXJnZXQgaXMgYW4gaXRlcmF0b3JcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYWJsZTtcbiAgICBpID0gMDtcblxuICAgIHdoaWxlICgocyA9IGl0ZXJhdG9yLm5leHQoKSwgcy5kb25lICE9PSB0cnVlKSkge1xuICAgICAgY2FsbGJhY2socy52YWx1ZSwgaSk7XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBhIHBsYWluIG9iamVjdFxuICBmb3IgKGsgaW4gaXRlcmFibGUpIHtcbiAgICBpZiAoaXRlcmFibGUuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2tdLCBrKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm47XG59XG5cbi8qKlxuICogU2FtZSBmdW5jdGlvbiBhcyB0aGUgYWJvdmUgYGZvckVhY2hgIGJ1dCB3aWxsIHlpZWxkIGBudWxsYCB3aGVuIHRoZSB0YXJnZXRcbiAqIGRvZXMgbm90IGhhdmUga2V5cy5cbiAqXG4gKiBAcGFyYW0gIHthbnl9ICAgICAgaXRlcmFibGUgLSBJdGVyYWJsZSB2YWx1ZS5cbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLlxuICovXG5mb3JFYWNoLmZvckVhY2hXaXRoTnVsbEtleXMgPSBmdW5jdGlvbihpdGVyYWJsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGl0ZXJhdG9yLCBrLCBpLCBsLCBzO1xuXG4gIGlmICghaXRlcmFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoV2l0aE51bGxLZXlzOiBpbnZhbGlkIGl0ZXJhYmxlLicpO1xuXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoV2l0aE51bGxLZXlzOiBleHBlY3RpbmcgYSBjYWxsYmFjay4nKTtcblxuICAvLyBUaGUgdGFyZ2V0IGlzIGFuIGFycmF5IG9yIGEgc3RyaW5nIG9yIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICBpZiAoXG4gICAgQXJyYXkuaXNBcnJheShpdGVyYWJsZSkgfHxcbiAgICAoQVJSQVlfQlVGRkVSX1NVUFBPUlQgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KGl0ZXJhYmxlKSkgfHxcbiAgICB0eXBlb2YgaXRlcmFibGUgPT09ICdzdHJpbmcnIHx8XG4gICAgaXRlcmFibGUudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSdcbiAgKSB7XG4gICAgZm9yIChpID0gMCwgbCA9IGl0ZXJhYmxlLmxlbmd0aDsgaSA8IGw7IGkrKylcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2ldLCBudWxsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGlzIGEgU2V0XG4gIGlmIChpdGVyYWJsZSBpbnN0YW5jZW9mIFNldCkge1xuICAgIGl0ZXJhYmxlLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGNhbGxiYWNrKHZhbHVlLCBudWxsKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGhhcyBhICMuZm9yRWFjaCBtZXRob2RcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5mb3JFYWNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmFibGUuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBpdGVyYWJsZVxuICBpZiAoXG4gICAgU1lNQk9MX1NVUFBPUlQgJiZcbiAgICBTeW1ib2wuaXRlcmF0b3IgaW4gaXRlcmFibGUgJiZcbiAgICB0eXBlb2YgaXRlcmFibGUubmV4dCAhPT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICBpdGVyYWJsZSA9IGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIC8vIFRoZSB0YXJnZXQgaXMgYW4gaXRlcmF0b3JcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYWJsZTtcbiAgICBpID0gMDtcblxuICAgIHdoaWxlICgocyA9IGl0ZXJhdG9yLm5leHQoKSwgcy5kb25lICE9PSB0cnVlKSkge1xuICAgICAgY2FsbGJhY2socy52YWx1ZSwgbnVsbCk7XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBhIHBsYWluIG9iamVjdFxuICBmb3IgKGsgaW4gaXRlcmFibGUpIHtcbiAgICBpZiAoaXRlcmFibGUuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2tdLCBrKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm47XG59O1xuXG4vKipcbiAqIEV4cG9ydGluZy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmb3JFYWNoO1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/obliterator/foreach.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/obliterator/iterator.js":
/*!**********************************************!*\
  !*** ./node_modules/obliterator/iterator.js ***!
  \**********************************************/
/***/ ((module) => {

eval("/**\n * Obliterator Iterator Class\n * ===========================\n *\n * Simple class representing the library's iterators.\n */\n\n/**\n * Iterator class.\n *\n * @constructor\n * @param {function} next - Next function.\n */\nfunction Iterator(next) {\n\n  // Hiding the given function\n  Object.defineProperty(this, '_next', {\n    writable: false,\n    enumerable: false,\n    value: next\n  });\n\n  // Is the iterator complete?\n  this.done = false;\n}\n\n/**\n * Next function.\n *\n * @return {object}\n */\n// NOTE: maybe this should dropped for performance?\nIterator.prototype.next = function() {\n  if (this.done)\n    return {done: true};\n\n  var step = this._next();\n\n  if (step.done)\n    this.done = true;\n\n  return step;\n};\n\n/**\n * If symbols are supported, we add `next` to `Symbol.iterator`.\n */\nif (typeof Symbol !== 'undefined')\n  Iterator.prototype[Symbol.iterator] = function() {\n    return this;\n  };\n\n/**\n * Returning an iterator of the given values.\n *\n * @param  {any...} values - Values.\n * @return {Iterator}\n */\nIterator.of = function() {\n  var args = arguments,\n      l = args.length,\n      i = 0;\n\n  return new Iterator(function() {\n    if (i >= l)\n      return {done: true};\n\n    return {done: false, value: args[i++]};\n  });\n};\n\n/**\n * Returning an empty iterator.\n *\n * @return {Iterator}\n */\nIterator.empty = function() {\n  var iterator = new Iterator(null);\n  iterator.done = true;\n\n  return iterator;\n};\n\n/**\n * Returning whether the given value is an iterator.\n *\n * @param  {any} value - Value.\n * @return {boolean}\n */\nIterator.is = function(value) {\n  if (value instanceof Iterator)\n    return true;\n\n  return (\n    typeof value === 'object' &&\n    value !== null &&\n    typeof value.next === 'function'\n  );\n};\n\n/**\n * Exporting.\n */\nmodule.exports = Iterator;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvb2JsaXRlcmF0b3IvaXRlcmF0b3IuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7O0FBRVo7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVksUUFBUTtBQUNwQixZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYzs7QUFFZCxZQUFZO0FBQ1osR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVksS0FBSztBQUNqQixZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGp1YW5wXFxHYXVudGxldEFJXFxQcm9qZWN0IDFcXG5vZGVfbW9kdWxlc1xcb2JsaXRlcmF0b3JcXGl0ZXJhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2JsaXRlcmF0b3IgSXRlcmF0b3IgQ2xhc3NcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIFNpbXBsZSBjbGFzcyByZXByZXNlbnRpbmcgdGhlIGxpYnJhcnkncyBpdGVyYXRvcnMuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRvciBjbGFzcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG5leHQgLSBOZXh0IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBJdGVyYXRvcihuZXh0KSB7XG5cbiAgLy8gSGlkaW5nIHRoZSBnaXZlbiBmdW5jdGlvblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ19uZXh0Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB2YWx1ZTogbmV4dFxuICB9KTtcblxuICAvLyBJcyB0aGUgaXRlcmF0b3IgY29tcGxldGU/XG4gIHRoaXMuZG9uZSA9IGZhbHNlO1xufVxuXG4vKipcbiAqIE5leHQgZnVuY3Rpb24uXG4gKlxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG4vLyBOT1RFOiBtYXliZSB0aGlzIHNob3VsZCBkcm9wcGVkIGZvciBwZXJmb3JtYW5jZT9cbkl0ZXJhdG9yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRvbmUpXG4gICAgcmV0dXJuIHtkb25lOiB0cnVlfTtcblxuICB2YXIgc3RlcCA9IHRoaXMuX25leHQoKTtcblxuICBpZiAoc3RlcC5kb25lKVxuICAgIHRoaXMuZG9uZSA9IHRydWU7XG5cbiAgcmV0dXJuIHN0ZXA7XG59O1xuXG4vKipcbiAqIElmIHN5bWJvbHMgYXJlIHN1cHBvcnRlZCwgd2UgYWRkIGBuZXh0YCB0byBgU3ltYm9sLml0ZXJhdG9yYC5cbiAqL1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnKVxuICBJdGVyYXRvci5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4vKipcbiAqIFJldHVybmluZyBhbiBpdGVyYXRvciBvZiB0aGUgZ2l2ZW4gdmFsdWVzLlxuICpcbiAqIEBwYXJhbSAge2FueS4uLn0gdmFsdWVzIC0gVmFsdWVzLlxuICogQHJldHVybiB7SXRlcmF0b3J9XG4gKi9cbkl0ZXJhdG9yLm9mID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgbCA9IGFyZ3MubGVuZ3RoLFxuICAgICAgaSA9IDA7XG5cbiAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpIHtcbiAgICBpZiAoaSA+PSBsKVxuICAgICAgcmV0dXJuIHtkb25lOiB0cnVlfTtcblxuICAgIHJldHVybiB7ZG9uZTogZmFsc2UsIHZhbHVlOiBhcmdzW2krK119O1xuICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJuaW5nIGFuIGVtcHR5IGl0ZXJhdG9yLlxuICpcbiAqIEByZXR1cm4ge0l0ZXJhdG9yfVxuICovXG5JdGVyYXRvci5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlcmF0b3IgPSBuZXcgSXRlcmF0b3IobnVsbCk7XG4gIGl0ZXJhdG9yLmRvbmUgPSB0cnVlO1xuXG4gIHJldHVybiBpdGVyYXRvcjtcbn07XG5cbi8qKlxuICogUmV0dXJuaW5nIHdoZXRoZXIgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIGl0ZXJhdG9yLlxuICpcbiAqIEBwYXJhbSAge2FueX0gdmFsdWUgLSBWYWx1ZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbkl0ZXJhdG9yLmlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSXRlcmF0b3IpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgdmFsdWUgIT09IG51bGwgJiZcbiAgICB0eXBlb2YgdmFsdWUubmV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICApO1xufTtcblxuLyoqXG4gKiBFeHBvcnRpbmcuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gSXRlcmF0b3I7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/obliterator/iterator.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/obliterator/foreach.js":
/*!*********************************************!*\
  !*** ./node_modules/obliterator/foreach.js ***!
  \*********************************************/
/***/ ((module) => {

eval("/**\n * Obliterator ForEach Function\n * =============================\n *\n * Helper function used to easily iterate over mixed values.\n */\n\n/**\n * Constants.\n */\nvar ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== 'undefined',\n    SYMBOL_SUPPORT = typeof Symbol !== 'undefined';\n\n/**\n * Function able to iterate over almost any iterable JS value.\n *\n * @param  {any}      iterable - Iterable value.\n * @param  {function} callback - Callback function.\n */\nfunction forEach(iterable, callback) {\n  var iterator, k, i, l, s;\n\n  if (!iterable)\n    throw new Error('obliterator/forEach: invalid iterable.');\n\n  if (typeof callback !== 'function')\n    throw new Error('obliterator/forEach: expecting a callback.');\n\n  // The target is an array or a string or function arguments\n  if (\n    Array.isArray(iterable) ||\n    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||\n    typeof iterable === 'string' ||\n    iterable.toString() === '[object Arguments]'\n  ) {\n    for (i = 0, l = iterable.length; i < l; i++)\n      callback(iterable[i], i);\n    return;\n  }\n\n  // The target has a #.forEach method\n  if (typeof iterable.forEach === 'function') {\n    iterable.forEach(callback);\n    return;\n  }\n\n  // The target is iterable\n  if (\n    SYMBOL_SUPPORT &&\n    Symbol.iterator in iterable &&\n    typeof iterable.next !== 'function'\n  ) {\n    iterable = iterable[Symbol.iterator]();\n  }\n\n  // The target is an iterator\n  if (typeof iterable.next === 'function') {\n    iterator = iterable;\n    i = 0;\n\n    while ((s = iterator.next(), s.done !== true)) {\n      callback(s.value, i);\n      i++;\n    }\n\n    return;\n  }\n\n  // The target is a plain object\n  for (k in iterable) {\n    if (iterable.hasOwnProperty(k)) {\n      callback(iterable[k], k);\n    }\n  }\n\n  return;\n}\n\n/**\n * Same function as the above `forEach` but will yield `null` when the target\n * does not have keys.\n *\n * @param  {any}      iterable - Iterable value.\n * @param  {function} callback - Callback function.\n */\nforEach.forEachWithNullKeys = function(iterable, callback) {\n  var iterator, k, i, l, s;\n\n  if (!iterable)\n    throw new Error('obliterator/forEachWithNullKeys: invalid iterable.');\n\n  if (typeof callback !== 'function')\n    throw new Error('obliterator/forEachWithNullKeys: expecting a callback.');\n\n  // The target is an array or a string or function arguments\n  if (\n    Array.isArray(iterable) ||\n    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||\n    typeof iterable === 'string' ||\n    iterable.toString() === '[object Arguments]'\n  ) {\n    for (i = 0, l = iterable.length; i < l; i++)\n      callback(iterable[i], null);\n    return;\n  }\n\n  // The target is a Set\n  if (iterable instanceof Set) {\n    iterable.forEach(function(value) {\n      callback(value, null);\n    });\n    return;\n  }\n\n  // The target has a #.forEach method\n  if (typeof iterable.forEach === 'function') {\n    iterable.forEach(callback);\n    return;\n  }\n\n  // The target is iterable\n  if (\n    SYMBOL_SUPPORT &&\n    Symbol.iterator in iterable &&\n    typeof iterable.next !== 'function'\n  ) {\n    iterable = iterable[Symbol.iterator]();\n  }\n\n  // The target is an iterator\n  if (typeof iterable.next === 'function') {\n    iterator = iterable;\n    i = 0;\n\n    while ((s = iterator.next(), s.done !== true)) {\n      callback(s.value, null);\n      i++;\n    }\n\n    return;\n  }\n\n  // The target is a plain object\n  for (k in iterable) {\n    if (iterable.hasOwnProperty(k)) {\n      callback(iterable[k], k);\n    }\n  }\n\n  return;\n};\n\n/**\n * Exporting.\n */\nmodule.exports = forEach;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvb2JsaXRlcmF0b3IvZm9yZWFjaC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFVBQVU7QUFDdEIsWUFBWSxVQUFVO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsT0FBTztBQUM1QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFVBQVU7QUFDdEIsWUFBWSxVQUFVO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsT0FBTztBQUM1QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxqdWFucFxcR2F1bnRsZXRBSVxcUHJvamVjdCAxXFxub2RlX21vZHVsZXNcXG9ibGl0ZXJhdG9yXFxmb3JlYWNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2JsaXRlcmF0b3IgRm9yRWFjaCBGdW5jdGlvblxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdXNlZCB0byBlYXNpbHkgaXRlcmF0ZSBvdmVyIG1peGVkIHZhbHVlcy5cbiAqL1xuXG4vKipcbiAqIENvbnN0YW50cy5cbiAqL1xudmFyIEFSUkFZX0JVRkZFUl9TVVBQT1JUID0gdHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyxcbiAgICBTWU1CT0xfU1VQUE9SVCA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcbiAqIEZ1bmN0aW9uIGFibGUgdG8gaXRlcmF0ZSBvdmVyIGFsbW9zdCBhbnkgaXRlcmFibGUgSlMgdmFsdWUuXG4gKlxuICogQHBhcmFtICB7YW55fSAgICAgIGl0ZXJhYmxlIC0gSXRlcmFibGUgdmFsdWUuXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaChpdGVyYWJsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGl0ZXJhdG9yLCBrLCBpLCBsLCBzO1xuXG4gIGlmICghaXRlcmFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoOiBpbnZhbGlkIGl0ZXJhYmxlLicpO1xuXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoOiBleHBlY3RpbmcgYSBjYWxsYmFjay4nKTtcblxuICAvLyBUaGUgdGFyZ2V0IGlzIGFuIGFycmF5IG9yIGEgc3RyaW5nIG9yIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICBpZiAoXG4gICAgQXJyYXkuaXNBcnJheShpdGVyYWJsZSkgfHxcbiAgICAoQVJSQVlfQlVGRkVSX1NVUFBPUlQgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KGl0ZXJhYmxlKSkgfHxcbiAgICB0eXBlb2YgaXRlcmFibGUgPT09ICdzdHJpbmcnIHx8XG4gICAgaXRlcmFibGUudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSdcbiAgKSB7XG4gICAgZm9yIChpID0gMCwgbCA9IGl0ZXJhYmxlLmxlbmd0aDsgaSA8IGw7IGkrKylcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2ldLCBpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGhhcyBhICMuZm9yRWFjaCBtZXRob2RcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5mb3JFYWNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmFibGUuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBpdGVyYWJsZVxuICBpZiAoXG4gICAgU1lNQk9MX1NVUFBPUlQgJiZcbiAgICBTeW1ib2wuaXRlcmF0b3IgaW4gaXRlcmFibGUgJiZcbiAgICB0eXBlb2YgaXRlcmFibGUubmV4dCAhPT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICBpdGVyYWJsZSA9IGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIC8vIFRoZSB0YXJnZXQgaXMgYW4gaXRlcmF0b3JcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYWJsZTtcbiAgICBpID0gMDtcblxuICAgIHdoaWxlICgocyA9IGl0ZXJhdG9yLm5leHQoKSwgcy5kb25lICE9PSB0cnVlKSkge1xuICAgICAgY2FsbGJhY2socy52YWx1ZSwgaSk7XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBhIHBsYWluIG9iamVjdFxuICBmb3IgKGsgaW4gaXRlcmFibGUpIHtcbiAgICBpZiAoaXRlcmFibGUuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2tdLCBrKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm47XG59XG5cbi8qKlxuICogU2FtZSBmdW5jdGlvbiBhcyB0aGUgYWJvdmUgYGZvckVhY2hgIGJ1dCB3aWxsIHlpZWxkIGBudWxsYCB3aGVuIHRoZSB0YXJnZXRcbiAqIGRvZXMgbm90IGhhdmUga2V5cy5cbiAqXG4gKiBAcGFyYW0gIHthbnl9ICAgICAgaXRlcmFibGUgLSBJdGVyYWJsZSB2YWx1ZS5cbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLlxuICovXG5mb3JFYWNoLmZvckVhY2hXaXRoTnVsbEtleXMgPSBmdW5jdGlvbihpdGVyYWJsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGl0ZXJhdG9yLCBrLCBpLCBsLCBzO1xuXG4gIGlmICghaXRlcmFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoV2l0aE51bGxLZXlzOiBpbnZhbGlkIGl0ZXJhYmxlLicpO1xuXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdvYmxpdGVyYXRvci9mb3JFYWNoV2l0aE51bGxLZXlzOiBleHBlY3RpbmcgYSBjYWxsYmFjay4nKTtcblxuICAvLyBUaGUgdGFyZ2V0IGlzIGFuIGFycmF5IG9yIGEgc3RyaW5nIG9yIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICBpZiAoXG4gICAgQXJyYXkuaXNBcnJheShpdGVyYWJsZSkgfHxcbiAgICAoQVJSQVlfQlVGRkVSX1NVUFBPUlQgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KGl0ZXJhYmxlKSkgfHxcbiAgICB0eXBlb2YgaXRlcmFibGUgPT09ICdzdHJpbmcnIHx8XG4gICAgaXRlcmFibGUudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSdcbiAgKSB7XG4gICAgZm9yIChpID0gMCwgbCA9IGl0ZXJhYmxlLmxlbmd0aDsgaSA8IGw7IGkrKylcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2ldLCBudWxsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGlzIGEgU2V0XG4gIGlmIChpdGVyYWJsZSBpbnN0YW5jZW9mIFNldCkge1xuICAgIGl0ZXJhYmxlLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGNhbGxiYWNrKHZhbHVlLCBudWxsKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaGUgdGFyZ2V0IGhhcyBhICMuZm9yRWFjaCBtZXRob2RcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5mb3JFYWNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmFibGUuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBpdGVyYWJsZVxuICBpZiAoXG4gICAgU1lNQk9MX1NVUFBPUlQgJiZcbiAgICBTeW1ib2wuaXRlcmF0b3IgaW4gaXRlcmFibGUgJiZcbiAgICB0eXBlb2YgaXRlcmFibGUubmV4dCAhPT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICBpdGVyYWJsZSA9IGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIC8vIFRoZSB0YXJnZXQgaXMgYW4gaXRlcmF0b3JcbiAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYWJsZTtcbiAgICBpID0gMDtcblxuICAgIHdoaWxlICgocyA9IGl0ZXJhdG9yLm5leHQoKSwgcy5kb25lICE9PSB0cnVlKSkge1xuICAgICAgY2FsbGJhY2socy52YWx1ZSwgbnVsbCk7XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVGhlIHRhcmdldCBpcyBhIHBsYWluIG9iamVjdFxuICBmb3IgKGsgaW4gaXRlcmFibGUpIHtcbiAgICBpZiAoaXRlcmFibGUuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIGNhbGxiYWNrKGl0ZXJhYmxlW2tdLCBrKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm47XG59O1xuXG4vKipcbiAqIEV4cG9ydGluZy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmb3JFYWNoO1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/obliterator/foreach.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/obliterator/iterator.js":
/*!**********************************************!*\
  !*** ./node_modules/obliterator/iterator.js ***!
  \**********************************************/
/***/ ((module) => {

eval("/**\n * Obliterator Iterator Class\n * ===========================\n *\n * Simple class representing the library's iterators.\n */\n\n/**\n * Iterator class.\n *\n * @constructor\n * @param {function} next - Next function.\n */\nfunction Iterator(next) {\n\n  // Hiding the given function\n  Object.defineProperty(this, '_next', {\n    writable: false,\n    enumerable: false,\n    value: next\n  });\n\n  // Is the iterator complete?\n  this.done = false;\n}\n\n/**\n * Next function.\n *\n * @return {object}\n */\n// NOTE: maybe this should dropped for performance?\nIterator.prototype.next = function() {\n  if (this.done)\n    return {done: true};\n\n  var step = this._next();\n\n  if (step.done)\n    this.done = true;\n\n  return step;\n};\n\n/**\n * If symbols are supported, we add `next` to `Symbol.iterator`.\n */\nif (typeof Symbol !== 'undefined')\n  Iterator.prototype[Symbol.iterator] = function() {\n    return this;\n  };\n\n/**\n * Returning an iterator of the given values.\n *\n * @param  {any...} values - Values.\n * @return {Iterator}\n */\nIterator.of = function() {\n  var args = arguments,\n      l = args.length,\n      i = 0;\n\n  return new Iterator(function() {\n    if (i >= l)\n      return {done: true};\n\n    return {done: false, value: args[i++]};\n  });\n};\n\n/**\n * Returning an empty iterator.\n *\n * @return {Iterator}\n */\nIterator.empty = function() {\n  var iterator = new Iterator(null);\n  iterator.done = true;\n\n  return iterator;\n};\n\n/**\n * Returning whether the given value is an iterator.\n *\n * @param  {any} value - Value.\n * @return {boolean}\n */\nIterator.is = function(value) {\n  if (value instanceof Iterator)\n    return true;\n\n  return (\n    typeof value === 'object' &&\n    value !== null &&\n    typeof value.next === 'function'\n  );\n};\n\n/**\n * Exporting.\n */\nmodule.exports = Iterator;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvb2JsaXRlcmF0b3IvaXRlcmF0b3IuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7O0FBRVo7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVksUUFBUTtBQUNwQixZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYzs7QUFFZCxZQUFZO0FBQ1osR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVksS0FBSztBQUNqQixZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGp1YW5wXFxHYXVudGxldEFJXFxQcm9qZWN0IDFcXG5vZGVfbW9kdWxlc1xcb2JsaXRlcmF0b3JcXGl0ZXJhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2JsaXRlcmF0b3IgSXRlcmF0b3IgQ2xhc3NcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIFNpbXBsZSBjbGFzcyByZXByZXNlbnRpbmcgdGhlIGxpYnJhcnkncyBpdGVyYXRvcnMuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRvciBjbGFzcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG5leHQgLSBOZXh0IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBJdGVyYXRvcihuZXh0KSB7XG5cbiAgLy8gSGlkaW5nIHRoZSBnaXZlbiBmdW5jdGlvblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ19uZXh0Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB2YWx1ZTogbmV4dFxuICB9KTtcblxuICAvLyBJcyB0aGUgaXRlcmF0b3IgY29tcGxldGU/XG4gIHRoaXMuZG9uZSA9IGZhbHNlO1xufVxuXG4vKipcbiAqIE5leHQgZnVuY3Rpb24uXG4gKlxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG4vLyBOT1RFOiBtYXliZSB0aGlzIHNob3VsZCBkcm9wcGVkIGZvciBwZXJmb3JtYW5jZT9cbkl0ZXJhdG9yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRvbmUpXG4gICAgcmV0dXJuIHtkb25lOiB0cnVlfTtcblxuICB2YXIgc3RlcCA9IHRoaXMuX25leHQoKTtcblxuICBpZiAoc3RlcC5kb25lKVxuICAgIHRoaXMuZG9uZSA9IHRydWU7XG5cbiAgcmV0dXJuIHN0ZXA7XG59O1xuXG4vKipcbiAqIElmIHN5bWJvbHMgYXJlIHN1cHBvcnRlZCwgd2UgYWRkIGBuZXh0YCB0byBgU3ltYm9sLml0ZXJhdG9yYC5cbiAqL1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnKVxuICBJdGVyYXRvci5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4vKipcbiAqIFJldHVybmluZyBhbiBpdGVyYXRvciBvZiB0aGUgZ2l2ZW4gdmFsdWVzLlxuICpcbiAqIEBwYXJhbSAge2FueS4uLn0gdmFsdWVzIC0gVmFsdWVzLlxuICogQHJldHVybiB7SXRlcmF0b3J9XG4gKi9cbkl0ZXJhdG9yLm9mID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgbCA9IGFyZ3MubGVuZ3RoLFxuICAgICAgaSA9IDA7XG5cbiAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpIHtcbiAgICBpZiAoaSA+PSBsKVxuICAgICAgcmV0dXJuIHtkb25lOiB0cnVlfTtcblxuICAgIHJldHVybiB7ZG9uZTogZmFsc2UsIHZhbHVlOiBhcmdzW2krK119O1xuICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJuaW5nIGFuIGVtcHR5IGl0ZXJhdG9yLlxuICpcbiAqIEByZXR1cm4ge0l0ZXJhdG9yfVxuICovXG5JdGVyYXRvci5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlcmF0b3IgPSBuZXcgSXRlcmF0b3IobnVsbCk7XG4gIGl0ZXJhdG9yLmRvbmUgPSB0cnVlO1xuXG4gIHJldHVybiBpdGVyYXRvcjtcbn07XG5cbi8qKlxuICogUmV0dXJuaW5nIHdoZXRoZXIgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIGl0ZXJhdG9yLlxuICpcbiAqIEBwYXJhbSAge2FueX0gdmFsdWUgLSBWYWx1ZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbkl0ZXJhdG9yLmlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSXRlcmF0b3IpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgdmFsdWUgIT09IG51bGwgJiZcbiAgICB0eXBlb2YgdmFsdWUubmV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICApO1xufTtcblxuLyoqXG4gKiBFeHBvcnRpbmcuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gSXRlcmF0b3I7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/obliterator/iterator.js\n");

/***/ })

};
;