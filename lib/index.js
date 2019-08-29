"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.symbol.iterator");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.from");

require("core-js/modules/es.array.index-of");

require("core-js/modules/es.array.is-array");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.map");

require("core-js/modules/es.object.define-properties");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.regexp.to-string");

require("core-js/modules/es.string.iterator");

require("core-js/modules/es.weak-map");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

require("core-js/modules/web.timers");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = createMemoizeMiddleware;
exports.memoize = memoize;

var _lodash = _interopRequireDefault(require("lodash.isequal"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var ACTION_TYPE = '@redux-memoize/action';
var DEFAULT_META = {
  ttl: 0,
  enabled: true,
  isEqual: _lodash["default"]
};

function isPromise(v) {
  return v && typeof v.then === 'function';
}

var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

function deepGet(map, args, isEqual) {
  var keys = Array.from(map.keys());

  for (var i = 0, len = keys.length; i < len; i += 1) {
    var key = keys[i];

    if (isEqual(key, args)) {
      return map.get(key);
    }
  }

  return null;
}

function createMemoizeMiddleware() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (canUseDOM && options.ttl === undefined) {
    throw new Error('[createMemoizeMiddleware(globalOptions)] globalOptions.ttl is REQUIRED');
  }

  var _options$disableTTL = options.disableTTL,
      disableTTL = _options$disableTTL === void 0 ? !canUseDOM : _options$disableTTL,
      globalOptions = _objectWithoutProperties(options, ["disableTTL"]);

  var cache = options.cache || new WeakMap();

  var middleware = function middleware(_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (_typeof(action) === 'object' && action.type === ACTION_TYPE) {
          var _action$payload = action.payload,
              fn = _action$payload.fn,
              args = _action$payload.args;

          var _DEFAULT_META$globalO = _objectSpread({}, DEFAULT_META, {}, globalOptions, {}, action.meta || {}),
              ttl = _DEFAULT_META$globalO.ttl,
              enabled = _DEFAULT_META$globalO.enabled,
              isEqual = _DEFAULT_META$globalO.isEqual;

          var taskCache = cache.get(fn);

          if (!taskCache) {
            taskCache = new Map();
            cache.set(fn, taskCache);
          }

          if (typeof enabled === 'function' ? enabled(getState) : enabled) {
            var task = deepGet(taskCache, args, isEqual);

            if (!task) {
              var _result = dispatch(fn.apply(void 0, _toConsumableArray(args)));

              task = isPromise(_result) ? _result : Promise.resolve(_result);
              var finalTTL = typeof ttl === 'function' ? ttl(getState) : ttl;

              if (finalTTL) {
                taskCache.set(args, task);

                if (!disableTTL) {
                  setTimeout(function () {
                    taskCache["delete"](args);
                  }, finalTTL);
                }
              }
            }

            return task;
          }

          var result = dispatch(fn.apply(void 0, _toConsumableArray(args)));
          return isPromise(result) ? result : Promise.resolve(result);
        }

        return next(action);
      };
    };
  };

  return middleware;
}

function memoize(opts, fn) {
  var func;
  var options;

  if (arguments.length < 2) {
    options = null;
    func = opts;
  } else {
    options = _typeof(opts) === 'object' ? opts : {
      ttl: opts
    };
    func = fn;
  }

  if (typeof func !== 'function') {
    throw new Error('Not a function');
  }

  var memoized = function memoized() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var action = {
      type: ACTION_TYPE,
      payload: {
        fn: func,
        args: args
      }
    };

    if (options) {
      action.meta = options;
    }

    return action;
  };

  memoized.unmemoized = func;
  return memoized;
}