import {
  applySnapshot,
  modelTypeKey,
  modelIdKey,
  onSnapshot,
  getSnapshot,
} from "mobx-keystone";

import AsyncLocalStorage from "./asyncLocalStorage";

export interface IArgs {
  (name: string, store: any, options?: IOptions): Promise<void>;
}
export interface IOptions {
  storage?: any;
  jsonify?: boolean;
  readonly whitelist?: Array<string>;
  readonly blacklist?: Array<string>;
}
type StrToAnyMap = { [key: string]: any };

export const persist: IArgs = (name, store, options = {}) => {
  let { storage, jsonify = true, whitelist, blacklist } = options;

  // use AsyncLocalStorage by default (or if localStorage was passed in)
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    (!storage || storage === window.localStorage)
  ) {
    storage = AsyncLocalStorage;
  }
  if (!storage) {
    return Promise.reject(
      "localStorage (the default storage engine) is not " +
        "supported in this environment. Please configure a different storage " +
        "engine via the `storage:` option."
    );
  }

  const whitelistSet = new Set(whitelist || []);
  const blacklistSet = new Set(blacklist || []);

  onSnapshot(store, (_snapshot: StrToAnyMap) => {
    // need to shallow clone as otherwise properties are non-configurable (https://github.com/agilgur5/mst-persist/pull/21#discussion_r348105595)
    const snapshot = { ..._snapshot };
    Object.keys(snapshot).forEach((key) => {
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

    const data = !jsonify ? snapshot : JSON.stringify(snapshot);
    storage.setItem(name, data);
  });

  return storage.getItem(name).then((data: object | string) => {
    const snapshot = !isString(data) ? data : JSON.parse(data);
    // don't apply falsey (which will error), leave store in initial state
    if (!snapshot) {
      return;
    }

    const defaults = getSnapshot(store);

    applySnapshot(store, {
      ...defaults,
      ...snapshot,
      $modelId: store.$modelId,
    });
  });
};

function isString(value: any): value is string {
  return typeof value === "string";
}

export default persist;
