"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({});
for (const file of ["midi.js", "charts.js", "suggestions.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../dist", file), "utf8"), context);
}
const { CHARTS, readRecordedBars, suggestNextChords } = context;
const names = (chords, key) => Array.from(suggestNextChords(chords, key), item => item.name);

assert.deepEqual(names([[50, 53, 57, 60], [43, 47, 50, 53]], "C:major"), ["Cmaj7", "Am7", "A♭maj7"]);
assert.deepEqual(names([[43, 47, 50, 53]], "C:minor"), ["Cm7", "A♭maj7", "Cmaj7"]);
assert.deepEqual(names([[52, 56, 59, 62]], "C:major"), ["Am7", "Dm7", "G7"]);
assert.deepEqual(names([[53, 56, 60, 63]], "C:major"), ["B♭7", "Cmaj7", "Dm7"]);
assert.deepEqual(names([[46, 50, 53, 56]], "C:major"), ["Cmaj7", "E♭maj7", "Dm7"]);
assert.deepEqual(names([[49, 53, 55, 59]], "C:major"), ["Cmaj7", "Dm7", "G7"]);
assert.deepEqual(names([[60, 61, 62]], "C:major"), []);
assert.deepEqual(names([], "C:major"), []);
const saved = readRecordedBars([
  [50, 53, 57, 60],
  { notes: [43, 47, 50, 53], label: "G7b9" },
  { notes: [60, 64, 300], label: "C" }
]);
assert.equal(saved.length, 2);
assert.equal(saved[0].label, "");
assert.equal(saved[1].label, "G7b9");
assert.equal(suggestNextChords([[60, 61, 62]], "C:major", ["G7b9"])[0].name, "Cmaj7");
for (const [key, charts] of Object.entries(CHARTS)) {
  const [ii, dominant] = charts.cadence.bars;
  const options = suggestNextChords([ii.notes, dominant.notes], key);
  const [resolution, deceptive] = options;
  assert.equal(new Set(options.map(option => option.name)).size, 3);
  const [tonic, mode] = key.split(":");
  const suffix = mode === "minor" ? "m7" : "maj7";
  assert.equal(resolution.name, tonic.replace("b", "♭").replace("#", "♯") + suffix);
  assert.equal(deceptive.notes.length, 4);
  assert.match(resolution.reason, /ii–V/);
}
console.log("Verified next-chord rules and tonic spelling in all 30 keys.");
