import { Model, modelAction, SnapshotOutOf, model, tProp } from "mobx-keystone";

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

export const persistedDataF: SnapshotOutOf<UserStoreF> = {
  name: "Persisted Name",
  age: 35,

  $modelType: "UserStoreF",
  $modelId: "abc",
};
