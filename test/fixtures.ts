import { Model, modelAction, SnapshotOutOf, model, tProp } from "mobx-keystone";
import { PersistedState } from "../src/types";

@model("UserStoreF")
class UserStoreF extends Model({
  name: tProp("John Doe"),
  age: tProp(32),
}) {
  @modelAction
  changeName(name: string) {
    this.name = name;
  }
}

export const createUserStore = () => new UserStoreF({ $modelId: "abc" });

export const persistedSnapshotF: SnapshotOutOf<UserStoreF> = {
  name: "Persisted Name",
  age: 35,
  $modelType: "UserStoreF",
  $modelId: "abc",
};

export const persistedDataF: PersistedState = {
  version: -1,
  snapshot: persistedSnapshotF,
};
