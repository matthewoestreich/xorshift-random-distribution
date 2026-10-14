import { describe, it } from "node:test";
import assert from "node:assert";
import PRNG from "../src/chrome-math-random.ts";

describe("PRNG -> XorShift128+", () => {
  it("is deterministic", () => {
    const prng = new PRNG(1n);
    const actual = prng.random();
    const expected = 0.48325704482897547;
    assert.equal(actual, expected);
  });
});
