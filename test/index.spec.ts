import { describe, it, expect, beforeEach } from "jest-without-globals";
import { getSnapshot } from "mobx-keystone";

import { persist, createMigrate, AnySnapshot } from "../src";
import {
  persistedDataF,
  createUserStore,
  persistedSnapshotF,
} from "./fixtures";

function getItem(key: string) {
  const item = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : null; // can only parse strings
}

describe("basic persist functionality", () => {
  beforeEach(() => window.localStorage.clear());

  it("should persist nothing if no actions are used", async () => {
    const user = createUserStore();
    await persist("user", user);

    expect(getItem("user")).toBe(null);
  });

  it("should persist snapshot when action used", async () => {
    const user = createUserStore();
    await persist("user", user);

    user.changeName("Joe"); // fire action to trigger onSnapshot

    expect(getItem("user")).toStrictEqual({
      ...persistedDataF,
      snapshot: getSnapshot(user),
    });
  });

  it("should load persisted data", async () => {
    window.localStorage.setItem("user", JSON.stringify(persistedDataF));

    const user = createUserStore();
    await persist("user", user);
    expect(getSnapshot(user)).toStrictEqual(persistedSnapshotF);
  });
});

describe("persist options", () => {
  beforeEach(() => window.localStorage.clear());

  it("shouldn't jsonify", async () => {
    const user = createUserStore();
    await persist("user", user, {
      jsonify: false,
    });

    user.changeName("Joe"); // fire action to trigger onSnapshot

    // if not jsonified, localStorage will store as '[object Object]'
    expect(window.localStorage.getItem("user")).toBe("[object Object]");
  });

  it("should whitelist", async () => {
    const user = createUserStore();
    await persist("user", user, {
      whitelist: ["name"],
    });

    user.changeName("Joe"); // fire action to trigger onSnapshot

    const snapshot = { ...getSnapshot(user) }; // need to shallow clone as otherwise properties are non-configurable (https://github.com/agilgur5/mst-persist/pull/21#discussion_r348105595)
    delete snapshot["age"];
    expect(getItem("user")).toStrictEqual({
      ...persistedDataF,
      snapshot,
    });
  });

  it("should blacklist", async () => {
    const user = createUserStore();
    await persist("user", user, {
      blacklist: ["age"],
    });

    user.changeName("Joe"); // fire action to trigger onSnapshot

    const snapshot = { ...getSnapshot(user) }; // need to shallow clone as otherwise properties are non-configurable (https://github.com/agilgur5/mst-persist/pull/21#discussion_r348105595)
    delete snapshot["age"];
    expect(getItem("user")).toStrictEqual({
      ...persistedDataF,
      snapshot,
    });
  });

  it("should support loading persisted data in old format", async () => {
    const user = createUserStore();

    window.localStorage.setItem("user", JSON.stringify(persistedSnapshotF));
    await persist("user", user);

    expect(getSnapshot(user)).toStrictEqual(persistedSnapshotF);
  });
});

describe("migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("user", JSON.stringify(persistedDataF));
  });

  it("should not run migrations for older version", async () => {
    const user = createUserStore();
    const oldMigration = jest.fn((state) => state);

    window.localStorage.setItem(
      "user",
      JSON.stringify({ version: 1, snapshot: {} })
    );

    await persist("user", user, {
      version: 3,
      migrate: createMigrate({
        1: oldMigration,
      }),
    });

    expect(oldMigration).not.toBeCalled();
  });

  it("should migrate old version", async () => {
    const user = createUserStore();

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        version: 1,
        snapshot: {
          old_name: "Persisted Name",
          age: 35,
          obsolete_prop: 5,
          $modelType: "UserStoreF",
          $modelId: "abc",
        },
      })
    );

    const migration = jest.fn((snapshot) => {
      const newSnapshot: AnySnapshot = {
        ...snapshot,
        name: snapshot.old_name,
      };

      delete newSnapshot["obsolete_prop"];
      delete newSnapshot["old_name"];

      return newSnapshot;
    });

    await persist("user", user, {
      version: 2,
      migrate: createMigrate({
        2: migration,
      }),
    });

    expect(migration).toBeCalled();
    expect(getSnapshot(user)).toStrictEqual(persistedSnapshotF);
  });

  it("should migrate in right order", async () => {
    const user = createUserStore();

    const callOrder: number[] = [];
    const migrations = [0, 1, 2].map((i) =>
      jest.fn((state) => {
        callOrder.push(i);
        return state;
      })
    );

    await persist("user", user, {
      version: 10,
      migrate: createMigrate({
        8: migrations[2],
        2: migrations[0],
        5: migrations[1],
      }),
    });

    expect(callOrder).toStrictEqual([0, 1, 2]);
  });

  it("throw if persisted version is newer than current version", async () => {
    const user = createUserStore();

    await expect(
      persist("user", user, {
        version: -5,
        migrate: createMigrate({}),
      })
    ).rejects.toThrow();
  });

  it("should support async migration", async () => {
    const user = createUserStore();

    let hasResolved = false;
    const migration = jest.fn(
      (state) =>
        new Promise((resolve) => {
          setTimeout(() => {
            hasResolved = true;
            resolve(state);
          }, 200);
        })
    );

    await persist("user", user, {
      version: 1,
      migrate: createMigrate({
        1: migration,
      }),
    });

    expect(hasResolved).toBeTruthy();
  });
});
