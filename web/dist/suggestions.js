"use strict";

const SUGGESTION_LETTERS = "CDEFGAB";
const SUGGESTION_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SUGGESTION_MINOR = [0, 2, 3, 5, 7, 8, 10];
const SUGGESTION_VOICINGS = {
  maj7: [0, 16, 19, 23],
  m7: [0, 15, 19, 22],
  "7": [0, 16, 19, 22],
  "7♭9": [0, 16, 22, 25],
  "ø7": [0, 15, 18, 22]
};
const SUGGESTION_DOMINANTS = new Set(["7", "9", "13", "7♭9", "7♯9", "7♯11", "7alt"]);
const SUGGESTION_MINOR_CHORDS = new Set(["m", "m6", "m7", "m9", "m(maj7)"]);
const SUGGESTION_MAJOR_CHORDS = new Set(["", "6", "maj7", "maj9", "maj7♯11"]);

function pitchClass(value) {
  return (value % 12 + 12) % 12;
}

function suggestNextChords(chords, key) {
  if (!chords.length) return [];
  const [tonic, mode] = key.split(":");
  const minor = mode === "minor";
  const scale = minor ? SUGGESTION_MINOR : SUGGESTION_MAJOR;
  const tonicLetter = SUGGESTION_LETTERS.indexOf(tonic[0]);
  const tonicPitch = SUGGESTION_MAJOR[tonicLetter] + (tonic[1] === "#" ? 1 : tonic[1] === "b" ? -1 : 0);
  // Prefer chord interpretations whose root matches the lowest recorded note.
  const last = recognizeMidiChords(chords.at(-1))[0];
  if (!last) return [];
  const previous = chords.length > 1 ? recognizeMidiChords(chords.at(-2))[0] : undefined;

  function degreePitch(degree, alteration = 0) {
    return pitchClass(tonicPitch + scale[degree - 1] + alteration);
  }

  function choice(degree, suffix, reason, alteration = 0) {
    const letter = (tonicLetter + degree - 1) % 7;
    const pitch = degreePitch(degree, alteration);
    const offset = pitchClass(pitch - SUGGESTION_MAJOR[letter] + 6) - 6;
    const sign = offset < 0 ? "♭" : "♯";
    const root = SUGGESTION_LETTERS[letter] + sign.repeat(Math.abs(offset));
    const bass = 43 + pitchClass(pitch - 43);
    return { name: root + suffix, reason, notes: SUGGESTION_VOICINGS[suffix].map(interval => bass + interval) };
  }

  const tonicSuffix = minor ? "m7" : "maj7";
  const iiSuffix = minor ? "ø7" : "m7";
  const vSuffix = minor ? "7♭9" : "7";

  if (SUGGESTION_DOMINANTS.has(last.suffix)) {
    if (last.root === degreePitch(5)) {
      const cameFromIi = previous?.root === degreePitch(2) &&
        (minor ? previous.suffix === "ø7" : SUGGESTION_MINOR_CHORDS.has(previous.suffix));
      return [
        choice(1, tonicSuffix, cameFromIi ? "Completes the ii–V cadence on the tonic." : "Resolves the dominant back to the tonic."),
        choice(6, minor ? "maj7" : "m7", minor
          ? "A deceptive turn to VI keeps the tonic in reserve."
          : "A deceptive turn to vi resolves into the relative minor.")
      ];
    }
    if (last.root === degreePitch(2, -1)) {
      return [choice(1, tonicSuffix, "Resolves the tritone substitute down a half step to the tonic.")];
    }
    if (!minor && last.root === degreePitch(7, -1)) {
      return [
        choice(1, "maj7", "Takes the backdoor route from ♭VII7 to the tonic."),
        choice(3, "maj7", "Follows the dominant to ♭III a perfect fourth above.", -1)
      ];
    }
    const targetPitch = pitchClass(last.root + 5);
    const target = scale.findIndex(interval => pitchClass(tonicPitch + interval) === targetPitch) + 1;
    const targetSuffix = (minor ? ["m7", null, "maj7", "m7", "7", "maj7", "7"]
                                : ["maj7", "m7", "m7", "maj7", "7", "m7", null])[target - 1];
    return targetSuffix
      ? [choice(target, targetSuffix, "Follows the dominant to its target a perfect fourth above.")]
      : [];
  }

  if (last.root === degreePitch(2) &&
      (minor ? last.suffix === "ø7" : SUGGESTION_MINOR_CHORDS.has(last.suffix))) {
    return [
      choice(5, vSuffix, "Moves ii to V and sets up a tonic resolution."),
      choice(2, "7", "Uses ♭II7 in place of V for a chromatic approach to the tonic.", -1)
    ];
  }
  if (!minor && last.root === degreePitch(4) && SUGGESTION_MINOR_CHORDS.has(last.suffix)) {
    return [choice(7, "7", "Moves borrowed iv to ♭VII7 and sets up a backdoor cadence.", -1)];
  }
  if (last.root === degreePitch(1) &&
      (minor ? SUGGESTION_MINOR_CHORDS.has(last.suffix) : SUGGESTION_MAJOR_CHORDS.has(last.suffix))) {
    return [choice(2, iiSuffix, "Leaves the tonic through ii to set up a new cadence.")];
  }
  return [];
}
