// Barebones smoke test, not a full suite
import { describe, expect, it } from "bun:test";
import { clean, isFull, isPartial } from "./helpers.js";

describe("helpers", () => {
  it("detects partials by their leading underscore", () => {
    expect(isPartial("src/_header.hbs")).toBe(true);
    expect(isFull("src/index.hbs")).toBe(true);
  });

  it("cleans file names", async () => {
    expect(await clean("src/_header.hbs")).toBe("header");
  });
});
