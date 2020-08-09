/**
 * @jest-environment node
 */
// add tests in this file that are specific to node (vs. jsdom)

import { describe, it, expect } from "jest-without-globals";

import { persist } from "../src";
import { createUserStore } from "./fixtures";

describe("node usage", () => {
  it("should error on default localStorage usage", async () => {
    const user = createUserStore();
    await expect(persist("user", user)).rejects.toMatch(/^localStorage.+$/);
  });
});
