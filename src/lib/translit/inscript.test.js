import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { inscriptCharFor } from "./inscript.js";

/** Types a sequence of [code, shift] key presses. */
function type(keys) {
  return keys.map(([code, shift]) => inscriptCharFor(code, !!shift) ?? "").join("");
}

describe("inscript", () => {
  it("maps consonants and vowel signs", () => {
    // പള്ളി = പ ള ് ള ി
    assert.equal(
      type([["KeyH"], ["KeyN", true], ["KeyD"], ["KeyN", true], ["KeyF"]]),
      "പള്ളി",
    );
  });

  it("maps independent vowels on shift", () => {
    assert.equal(type([["KeyD", true], ["KeyE", true], ["KeyF", true]]), "അആഇ");
  });

  it("returns null for unmapped keys so they type normally", () => {
    assert.equal(inscriptCharFor("Digit1", false), null);
    assert.equal(inscriptCharFor("Space", false), null);
    assert.equal(inscriptCharFor("KeyV", true), null);
  });
});
