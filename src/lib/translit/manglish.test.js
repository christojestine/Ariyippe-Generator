import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { manglishToMalayalam, transliterateWord, tokenize } from "./manglish.js";

describe("manglish — tokenize", () => {
  it("prefers the longest token", () => {
    assert.deepEqual(tokenize("enthu"), ["e", "nth", "u"]);
    assert.deepEqual(tokenize("aaya"), ["aa", "y", "a"]);
  });
});

describe("manglish — words", () => {
  const cases = {
    aRiyipp: "അറിയിപ്പ്",
    kurbaana: "കുർബാന",
    njaayar: "ഞായർ",
    paLLi: "പള്ളി",
    maram: "മരം",
    avan: "അവൻ",
    ente: "എന്റെ",
    enthu: "എന്തു",
    vishuddha: "വിശുദ്ധ",
    prakaasham: "പ്രകാശം",
    kai: "കൈ",
    pallikku: "പള്ളിക്കു".replace("ള്ള", "ല്ല"),
    vyaazham: "വ്യാഴം",
    aaryan: "ആര്യൻ",
    thiruNaaL: "തിരുണാൾ",
    sEvanam: "സേവനം",
    kOLEj: "കോളേജ്",
    mukhyam: "മുഖ്യം",
    kaRRu: "കറ്റു",
    vettam: "വെട്ടം",
    "kR^ShNan": "കൃഷ്ണൻ",
    "avan~": "അവൻ",
    "k~": "ൿ",
    "p~": "പ്",
    "n~": "ൻ",
    "ammayu~": "അമ്മയു്",
    "k_ka": "ക്‌ക",
    OkTObar: "ഓക്ടോബർ",
  };
  for (const [input, expected] of Object.entries(cases)) {
    it(`${input} → ${expected}`, () => {
      assert.equal(transliterateWord(input), expected);
    });
  }
});

describe("manglish — text", () => {
  it("keeps spaces, digits and punctuation", () => {
    assert.equal(manglishToMalayalam("yooNitu 50, 51."), "യൂണിറ്റു 50, 51.");
  });

  it("leaves existing Malayalam untouched", () => {
    assert.equal(manglishToMalayalam("ഇന്ന് paLLi"), "ഇന്ന് പള്ളി");
  });
});
