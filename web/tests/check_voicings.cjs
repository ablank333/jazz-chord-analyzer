"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({});
for (const file of ["charts.js", "voicing.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../dist", file), "utf8"), context);
}
const { CHARTS, compareVoicings, voicingNoteName } = context;
const plain = value => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(compareVoicings([50, 53, 60], [43, 53, 59])),
                 { stay: [53], move: [[50, 43], [60, 59]], leave: [], enter: [] });
assert.deepEqual(plain(compareVoicings([53, 57, 60, 64], [53, 59, 64])),
                 { stay: [53, 64], move: [[60, 59]], leave: [57], enter: [] });
assert.deepEqual(plain(compareVoicings([53, 59, 64], [53, 57, 60, 64])),
                 { stay: [53, 64], move: [[59, 60]], leave: [], enter: [57] });
assert.equal(voicingNoteName(68, "G7b9"), "A♭4");
assert.equal(voicingNoteName(66, "Cm7b5"), "G♭4");
assert.equal(voicingNoteName(66, "Cmaj7#11"), "F♯4");
assert.equal(voicingNoteName(60, "B#7"), "B♯3");
const [ii, dominant] = CHARTS["C:major"].cadence.bars;
assert.ok(compareVoicings(ii.shell, dominant.shell).stay.length > 0);
for (const charts of Object.values(CHARTS)) {
  for (const { bars } of Object.values(charts)) {
    for (const bar of bars) {
      for (const note of [...bar.notes, ...bar.shell, ...bar.rootless]) {
        assert.match(voicingNoteName(note, bar.symbol), /^[A-G][♭♯]*\d$/u);
      }
    }
  }
}
console.log("Verified voice matching, enharmonic note names, and chart coverage.");
