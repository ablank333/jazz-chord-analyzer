"use strict";

function voicingNoteName(note, symbol) {
  const [, letter, accidental, suffix] = symbol.match(/^([A-G])([b#]*)(.*)$/);
  const letters = "CDEFGAB";
  const naturals = [0, 2, 4, 5, 7, 9, 11];
  const rootLetter = letters.indexOf(letter);
  const root = naturals[rootLetter] + (accidental.startsWith("#") ? 1 : -1) * accidental.length;
  const interval = (note - root + 120) % 12;
  const steps = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6];
  if (suffix === "m7b5") steps[6] = 4;
  if (suffix === "7alt") {
    steps[3] = 1;
    steps[8] = 5;
  }
  const target = (rootLetter + steps[interval]) % 7;
  const alteration = (note - naturals[target] + 6) % 12 - 6;
  const sign = alteration < 0 ? "♭" : "♯";
  const octave = (note - naturals[target] - alteration) / 12 - 1;
  return letters[target] + sign.repeat(Math.abs(alteration)) + octave;
}

function compareVoicings(current, next) {
  const stay = current.filter(note => next.includes(note));
  const from = current.filter(note => !stay.includes(note));
  const to = next.filter(note => !stay.includes(note));
  const moreOutgoing = from.length > to.length;
  const shorter = moreOutgoing ? to : from;
  const longer = moreOutgoing ? from : to;
  let best = [];
  let bestScore = Infinity;

  // Match moving voices in pitch order. Extra voices may enter or leave.
  function pair(index, start, pairs, score) {
    if (index === shorter.length) {
      if (score < bestScore) {
        bestScore = score;
        best = pairs;
      }
      return;
    }
    for (let i = start; i <= longer.length - (shorter.length - index); i++) {
      const a = shorter[index];
      const b = longer[i];
      pair(index + 1, i + 1, [...pairs, moreOutgoing ? [b, a] : [a, b]], score + Math.abs(b - a));
    }
  }

  pair(0, 0, [], 0);
  return {
    stay,
    move: best,
    leave: from.filter(note => !best.some(([first]) => note === first)),
    enter: to.filter(note => !best.some(([, second]) => note === second))
  };
}
