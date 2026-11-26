"use strict";

const tempoInput = document.querySelector("#tempo");
const play = document.querySelector("#play");
const playLabel = document.querySelector("#play-label");
const chart = document.querySelector("#chart");
const audioStatus = document.querySelector("#audio-status");
const keyboard = document.querySelector("#keyboard");
const svgNamespace = "http://www.w3.org/2000/svg";
const blackNotes = new Set([1, 3, 6, 8, 10]);
const sharpNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const flatNames = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
let currentChart;
let buttons = [];
let selected = 0;
let playing = false;
let timer;
let piano;
let pianoReady;
let request = 0;

function displayAccidentals(text) {
  return text.replaceAll("bb", "𝄫").replaceAll("##", "𝄪").replaceAll("b", "♭").replaceAll("#", "♯");
}

function renderChord(element, chord) {
  const [, root, ending] = chord.match(/^([A-G][b#]*)(.*)$/u);
  const rootText = document.createElement("span");
  const suffix = document.createElement("sup");
  rootText.textContent = displayAccidentals(root);
  suffix.textContent = displayAccidentals(ending);
  element.replaceChildren(rootText, suffix);
}

const keyOptions = Object.keys(globalThis.CHARTS).map(value => {
  const [tonic, mode] = value.split(":");
  return { value, label: displayAccidentals(tonic) + " " + mode };
});
const keySelect = createCombobox("key", "C:major", () => keyOptions, loadChart);
const kindSelect = createCombobox("kind", "cadence", () => [
  { value: "cadence", label: cadenceName() },
  { value: "turnaround", label: "Turnaround" },
  { value: "tritone", label: "Tritone sub" },
  { value: "jazz-blues", label: "12-bar jazz blues" },
  { value: "secondary-dominants", label: "Secondary dominants" },
  { value: "backdoor", label: "Backdoor cadence" },
  { value: "rhythm-bridge", label: "Rhythm changes bridge" },
  { value: "minor-line", label: "Minor line cliché" }
].filter(option => Object.hasOwn(globalThis.CHARTS[keySelect.selection().value], option.value)), loadChart);

function cadenceName() {
  return keySelect.selection().value.endsWith(":minor") ? "iiø–V–i" : "ii–V–I";
}

function svgElement(tag, attributes) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function renderKeyboard(notes) {
  const start = Math.floor(notes[0] / 12) * 12;
  const end = Math.floor(notes.at(-1) / 12) * 12 + 11;
  const whiteWidth = 359 / (((end - start + 1) / 12) * 7);
  const blackWidth = whiteWidth * 0.62;
  const active = new Set(notes);
  const whiteKeys = [];
  const blackKeys = [];
  let x = 0.5;
  for (let note = start; note <= end; note++) {
    const black = blackNotes.has(note % 12);
    const left = black ? x - blackWidth / 2 : x;
    const width = black ? blackWidth : whiteWidth;
    const height = black ? 64 : 104;
    const layer = black ? blackKeys : whiteKeys;
    layer.push(svgElement("rect", {
      x: left, y: 1, width, height,
      class: (black ? "black-key" : "white-key") + (active.has(note) ? " active" : "")
    }));
    if (active.has(note)) {
      layer.push(svgElement("circle", { cx: left + width / 2, cy: height - 9, r: 2.6, class: "key-marker" }));
    }
    if (!black) x += whiteWidth;
  }
  keyboard.replaceChildren(...whiteKeys, ...blackKeys);
}

function currentPitchNames() {
  return keySelect.selection().value.split(":")[0].includes("b") ? flatNames : sharpNames;
}

function showMeasure(index) {
  selected = index;
  const bar = currentChart.bars[index];
  buttons.forEach((button, position) => {
    button.setAttribute("aria-pressed", String(index === position));
    button.dataset.playing = String(playing && index === position);
  });
  const pitchNames = currentPitchNames();
  const notes = bar.notes.map(note => pitchNames[note % 12] + (Math.floor(note / 12) - 1));
  document.querySelector("#bar").textContent = "bar " + (index + 1);
  renderChord(document.querySelector("#selected-chord"), bar.symbol);
  document.querySelector("#notes").textContent = notes.join(" · ");
  keyboard.setAttribute("aria-label", "Selected notes: " + notes.join(", "));
  renderKeyboard(bar.notes);
}

function updatePlayButton() {
  play.dataset.playing = String(playing);
  playLabel.textContent = playing ? "Pause" : "Play";
}

function stop() {
  request++;
  playing = false;
  clearTimeout(timer);
  audioStatus.textContent = "";
  if (piano?.loaded) piano.releaseAll();
  updatePlayButton();
  if (currentChart) showMeasure(selected);
}

async function prepareAudio() {
  if (!globalThis.Tone) throw new Error("Tone.js unavailable");
  await Tone.start();
  if (!pianoReady) {
    const sampleNames = ["A0", "C8"];
    for (let octave = 1; octave <= 7; octave++) {
      for (const note of ["C", "D#", "F#", "A"]) sampleNames.push(note + octave);
    }
    pianoReady = new Promise((resolve, reject) => {
      piano = new Tone.Sampler({
        urls: Object.fromEntries(sampleNames.map(note => [note, note.replace("#", "s") + ".mp3"])),
        baseUrl: new URL("audio/piano/", document.baseURI).href,
        attack: 0.004,
        release: 0.38,
        volume: -11,
        onload: resolve,
        onerror: reject
      }).toDestination();
    }).catch(error => {
      piano?.dispose();
      piano = undefined;
      pianoReady = undefined;
      throw error;
    });
  }
  await pianoReady;
}

function playNotes(notes, duration) {
  const start = Tone.now();
  const spacing = Math.min(0.007, 0.025 / Math.max(notes.length - 1, 1));
  notes.forEach((note, index) => {
    const key = Tone.Frequency(note, "midi").toNote();
    const velocity = index === 0 ? 0.76 : index === notes.length - 1 ? 0.72 : 0.65;
    piano.triggerAttackRelease(key, duration, start + index * spacing, velocity);
  });
}

function barDuration() {
  const bpm = Number(tempoInput.value) || 108;
  return 240 / Math.min(280, Math.max(40, bpm));
}

function advance() {
  if (!playing) return;
  const duration = barDuration();
  showMeasure(selected);
  playNotes(currentChart.bars[selected].notes, duration * 0.86);
  timer = setTimeout(() => {
    if (selected === currentChart.bars.length - 1) {
      stop();
      showMeasure(0);
    } else {
      selected++;
      advance();
    }
  }, duration * 1000);
}

async function enableAudio(onReady) {
  const started = ++request;
  audioStatus.textContent = piano?.loaded ? "" : "Loading grand piano…";
  try {
    await prepareAudio();
    if (started === request) {
      audioStatus.textContent = "";
      onReady();
    }
  } catch {
    if (started === request) audioStatus.textContent = "Could not load the piano. Try playing again.";
  }
}

function loadChart() {
  stop();
  const key = keySelect.selection();
  kindSelect.refresh("cadence");
  const kind = kindSelect.selection();
  currentChart = globalThis.CHARTS[key.value][kind.value];
  document.querySelector("#chart-title").textContent = kind.label;
  document.querySelector("#chart-key").textContent = key.label;
  buttons = currentChart.bars.map((bar, index) => {
    const button = document.createElement("button");
    const number = document.createElement("span");
    const symbol = document.createElement("span");
    const roman = document.createElement("span");
    button.type = "button";
    button.className = "measure";
    button.setAttribute("aria-label", "Bar " + (index + 1) + ": " + bar.symbol + ", " + bar.roman);
    number.className = "measure-number";
    number.textContent = index + 1;
    symbol.className = "symbol";
    renderChord(symbol, bar.symbol);
    roman.className = "roman";
    roman.textContent = displayAccidentals(bar.roman);
    button.append(number, symbol, roman);
    button.addEventListener("click", () => {
      stop();
      showMeasure(index);
      enableAudio(() => playNotes(bar.notes, Math.min(1.16, barDuration() * 0.8)));
    });
    return button;
  });
  chart.replaceChildren(...buttons);
  showMeasure(0);
  midiRecorder.render();
}

play.addEventListener("click", () => {
  if (playing) {
    stop();
  } else {
    enableAudio(() => {
      playing = true;
      updatePlayButton();
      advance();
    });
  }
});
tempoInput.addEventListener("change", () => {
  tempoInput.value = Math.min(280, Math.max(40, Number(tempoInput.value) || 108));
});
const midiRecorder = setupMidiRecorder({
  pitchNames: currentPitchNames,
  suggest: chords => suggestNextChords(chords, keySelect.selection().value),
  audition: notes => {
    stop();
    enableAudio(() => playNotes(notes, Math.min(1.16, barDuration() * 0.8)));
  }
});
loadChart();
