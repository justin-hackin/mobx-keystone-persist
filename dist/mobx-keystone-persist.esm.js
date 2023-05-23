import { modelTypeKey, modelIdKey, onSnapshot, getSnapshot, applySnapshot } from 'mobx-keystone';
import debounce from 'lodash.debounce';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

// using istanbul ignore on portions of code that are not currently used internally
var AsyncLocalStorage = {
  // must use wrapper functions when passing localStorage functions (https://github.com/agilgur5/mst-persist/issues/18)
  clear
  /* istanbul ignore next */
  : function clear() {
    return callWithPromise(function () {
      return window.localStorage.clear();
    });
  },
  getItem: function getItem(key) {
    return callWithPromise(function () {
      return window.localStorage.getItem(key);
    });
  },
  removeItem
  /* istanbul ignore next */
  : function removeItem(key) {
    return callWithPromise(function () {
      return window.localStorage.removeItem(key);
    });
  },
  setItem: function setItem(key, value) {
    return callWithPromise(function () {
      return window.localStorage.setItem(key, value);
    });
  }
};

function callWithPromise(func) {
  try {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return Promise.resolve(func.apply(void 0, args));
  } catch (err) {
    /* istanbul ignore next */
    return Promise.reject(err);
  }
}

var DEFAULT_VERSION = -1;

function isString(value) {
  return typeof value === "string";
}
function isSnapshot(value) {
  return value && value.$modelId !== undefined;
}
function isPromise(maybePromise) {
  return "then" in maybePromise;
}

var persist = function persist(name, store, options) {
  if (options === void 0) {
    options = {};
  }

  try {
    var _options = options,
        storage = _options.storage,
        _options$jsonify = _options.jsonify,
        jsonify = _options$jsonify === void 0 ? true : _options$jsonify,
        whitelist = _options.whitelist,
        blacklist = _options.blacklist,
        _options$version = _options.version,
        version = _options$version === void 0 ? DEFAULT_VERSION : _options$version,
        migrate = _options.migrate,
        throttle = _options.throttle; // use AsyncLocalStorage by default (or if localStorage was passed in)

    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined" && (!storage || storage === window.localStorage)) {
      storage = AsyncLocalStorage;
    }

    if (!storage) {
      return Promise.reject("localStorage (the default storage engine) is not " + "supported in this environment. Please configure a different storage " + "engine via the `storage:` option.");
    }

    var whitelistSet = new Set(whitelist || []);
    var blacklistSet = new Set(blacklist || []);

    var persistSnapshot = function persistSnapshot(_snapshot) {
      // need to shallow clone as otherwise properties are non-configurable (https://github.com/agilgur5/mst-persist/pull/21#discussion_r348105595)
      var snapshot = _extends({}, _snapshot);

      Object.keys(snapshot).forEach(function (key) {
        if (key === modelTypeKey || key === modelIdKey) {
          return;
        }

        if (whitelist && !whitelistSet.has(key)) {
          delete snapshot[key];
        }

        if (blacklist && blacklistSet.has(key)) {
          delete snapshot[key];
        }
      });
      var state = {
        version: options.version || DEFAULT_VERSION,
        snapshot: snapshot
      };
      var data = !jsonify ? state : JSON.stringify(state);
      storage.setItem(name, data);
    };

    onSnapshot(store, typeof throttle === "number" ? debounce(persistSnapshot, throttle) : persistSnapshot);
    return Promise.resolve(storage.getItem(name)).then(function (data) {
      function _temp2() {
        var defaults = getSnapshot(store);

        for (var _i = 0, _Object$keys = Object.keys(state.snapshot); _i < _Object$keys.length; _i++) {
          var key = _Object$keys[_i];

          if (!(key in defaults)) {
            console.warn("mobx-keystone-persist: persisted store contained non-existent key: " + key);
            delete state.snapshot[key];
          }
        }

        applySnapshot(store, _extends({}, defaults, state.snapshot, {
          $modelId: store.$modelId
        }));
      }

      var stateOrSnapshot = !isString(data) ? data : JSON.parse(data); // don't apply falsey (which will error), leave store in initial state

      if (!stateOrSnapshot) {
        return;
      }

      var state; // account for pre-migration support

      if (isSnapshot(stateOrSnapshot)) {
        state = {
          version: DEFAULT_VERSION,
          snapshot: stateOrSnapshot
        };
      } else {
        state = stateOrSnapshot;
      }

      var _temp = function () {
        if (migrate) {
          return Promise.resolve(migrate(state, version)).then(function (_migrate) {
            state = _migrate;
          });
        }
      }();

      return _temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp);
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

// A type of promise-like that resolves synchronously and supports only one observer
const _Pact = /*#__PURE__*/(function() {
	function _Pact() {}
	_Pact.prototype.then = function(onFulfilled, onRejected) {
		const result = new _Pact();
		const state = this.s;
		if (state) {
			const callback = state & 1 ? onFulfilled : onRejected;
			if (callback) {
				try {
					_settle(result, 1, callback(this.v));
				} catch (e) {
					_settle(result, 2, e);
				}
				return result;
			} else {
				return this;
			}
		}
		this.o = function(_this) {
			try {
				const value = _this.v;
				if (_this.s & 1) {
					_settle(result, 1, onFulfilled ? onFulfilled(value) : value);
				} else if (onRejected) {
					_settle(result, 1, onRejected(value));
				} else {
					_settle(result, 2, value);
				}
			} catch (e) {
				_settle(result, 2, e);
			}
		};
		return result;
	};
	return _Pact;
})();

// Settles a pact synchronously
function _settle(pact, state, value) {
	if (!pact.s) {
		if (value instanceof _Pact) {
			if (value.s) {
				if (state & 1) {
					state = value.s;
				}
				value = value.v;
			} else {
				value.o = _settle.bind(null, pact, state);
				return;
			}
		}
		if (value && value.then) {
			value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
			return;
		}
		pact.s = state;
		pact.v = value;
		const observer = pact.o;
		if (observer) {
			observer(pact);
		}
	}
}

function _isSettledPact(thenable) {
	return thenable instanceof _Pact && thenable.s & 1;
}

// Asynchronously iterate through an object that has a length property, passing the index as the first argument to the callback (even as the length property changes)
function _forTo(array, body, check) {
	var i = -1, pact, reject;
	function _cycle(result) {
		try {
			while (++i < array.length && (!check || !check())) {
				result = body(i);
				if (result && result.then) {
					if (_isSettledPact(result)) {
						result = result.v;
					} else {
						result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
						return;
					}
				}
			}
			if (pact) {
				_settle(pact, 1, result);
			} else {
				pact = result;
			}
		} catch (e) {
			_settle(pact || (pact = new _Pact()), 2, e);
		}
	}
	_cycle();
	return pact;
}

const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

// Asynchronously iterate through an object's values
// Uses for...of if the runtime supports it, otherwise iterates until length on a copy
function _forOf(target, body, check) {
	if (typeof target[_iteratorSymbol] === "function") {
		var iterator = target[_iteratorSymbol](), step, pact, reject;
		function _cycle(result) {
			try {
				while (!(step = iterator.next()).done && (!check || !check())) {
					result = body(step.value);
					if (result && result.then) {
						if (_isSettledPact(result)) {
							result = result.v;
						} else {
							result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
							return;
						}
					}
				}
				if (pact) {
					_settle(pact, 1, result);
				} else {
					pact = result;
				}
			} catch (e) {
				_settle(pact || (pact = new _Pact()), 2, e);
			}
		}
		_cycle();
		if (iterator.return) {
			var _fixup = function(value) {
				try {
					if (!step.done) {
						iterator.return();
					}
				} catch(e) {
				}
				return value;
			};
			if (pact && pact.then) {
				return pact.then(_fixup, function(e) {
					throw _fixup(e);
				});
			}
			_fixup();
		}
		return pact;
	}
	// No support for Symbol.iterator
	if (!("length" in target)) {
		throw new TypeError("Object is not iterable");
	}
	// Handle live collections properly
	var values = [];
	for (var i = 0; i < target.length; i++) {
		values.push(target[i]);
	}
	return _forTo(values, function(i) { return body(values[i]); }, check);
}

const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

function createMigrate(migrations, options) {
  var _ref = options || {},
      debug = _ref.debug;

  return function (state, currentVersion) {
    try {
      var inboundVersion = state.version !== undefined ? state.version : DEFAULT_VERSION;

      if (inboundVersion === currentVersion) {
        if (process.env.NODE_ENV !== "production" && debug) console.log("mobx-keystone-persist: versions match, noop migration");
        return Promise.resolve(state);
      }

      if (inboundVersion > currentVersion) throw new Error("downgrading version is not supported");
      var migrationKeys = Object.keys(migrations).map(function (ver) {
        return parseInt(ver);
      }).filter(function (key) {
        return currentVersion >= key && key > inboundVersion;
      }).sort(function (a, b) {
        return a - b;
      });
      if (process.env.NODE_ENV !== "production" && debug) console.log("mobx-keystone-persist: migrationKeys", migrationKeys);

      var _temp3 = _forOf(migrationKeys, function (versionKey) {
        function _temp(_snapshotOrPromise) {
          state = {
            version: versionKey,
            snapshot: _snapshotOrPromise
          };
        }

        if (process.env.NODE_ENV !== "production" && debug) console.log("mobx-keystone-persist: running migration for versionKey", versionKey);
        var snapshotOrPromise = migrations[versionKey](state.snapshot);

        var _isPromise = isPromise(snapshotOrPromise);

        return _isPromise ? Promise.resolve(snapshotOrPromise).then(_temp) : _temp(snapshotOrPromise);
      });

      return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(function () {
        return state;
      }) : state);
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

export default persist;
export { AsyncLocalStorage, DEFAULT_VERSION, createMigrate, persist };
//# sourceMappingURL=mobx-keystone-persist.esm.js.map
