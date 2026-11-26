"use strict";

const MIDI_CHORDS = [
  ["", [0, 4, 7]], ["m", [0, 3, 7]], ["dim", [0, 3, 6]], ["aug", [0, 4, 8]],
  ["sus4", [0, 5, 7]], ["6", [0, 4, 7, 9]], ["m6", [0, 3, 7, 9]],
  ["maj7", [0, 4, 7, 11]], ["maj7", [0, 4, 11]],
  ["m7", [0, 3, 7, 10]], ["m7", [0, 3, 10]],
  ["m(maj7)", [0, 3, 7, 11]], ["m(maj7)", [0, 3, 11]],
  ["7", [0, 4, 7, 10]], ["7", [0, 4, 10]],
  ["ø7", [0, 3, 6, 10]], ["dim7", [0, 3, 6, 9]],
  ["maj9", [0, 2, 4, 7, 11]], ["maj9", [0, 2, 4, 11]],
  ["m9", [0, 2, 3, 7, 10]], ["m9", [0, 2, 3, 10]],
  ["9", [0, 2, 4, 7, 10]], ["9", [0, 2, 4, 10]],
  ["7♭9", [0, 1, 4, 7, 10]], ["7♭9", [0, 1, 4, 10]],
  ["7♯9", [0, 3, 4, 7, 10]], ["7♯9", [0, 3, 4, 10]],
  ["7♯11", [0, 4, 6, 7, 10]], ["7♯11", [0, 4, 6, 10]],
  ["7alt", [0, 3, 4, 8, 10]],
  ["13", [0, 2, 4, 9, 10]], ["13", [0, 4, 9, 10]],
  ["maj7♯11", [0, 4, 6, 7, 11]], ["maj7♯11", [0, 4, 6, 11]]
];

function recognizeMidiChords(notes) {
  const classes = [...new Set(notes.map(note => note % 12))];
  const matches = [];
  for (const root of classes) {
    const intervals = classes.map(note => (note - root + 12) % 12).sort((a, b) => a - b).join(",");
    for (const [suffix, pattern] of MIDI_CHORDS) {
      if (pattern.join(",") === intervals) matches.push({ root, suffix });
    }
  }
  return matches;
}

function labelMidiChord(notes, names) {
  return recognizeMidiChords(notes).map(({ root, suffix }) => names[root] + suffix);
}

function createMidiCapture(onChord, schedule = setTimeout, cancel = clearTimeout) {
  let notes = new Set();
  let timer;

  function flush() {
    if (timer !== undefined) cancel(timer);
    timer = undefined;
    if (notes.size >= 3) onChord([...notes].sort((a, b) => a - b));
    notes = new Set();
  }

  function receive(data) {
    const [status, note, velocity] = data;
    if ((status & 0xf0) !== 0x90 || !velocity || note > 127) return;
    notes.add(note);
    if (timer === undefined) timer = schedule(flush, 140);
  }

  return { receive, flush };
}

function setupMidiRecorder({ pitchNames, suggest, audition }) {
  const button = document.querySelector("#midi-record");
  const device = document.querySelector("#midi-device");
  const deviceLabel = document.querySelector("#midi-device-label");
  const list = document.querySelector("#midi-chords");
  const clear = document.querySelector("#midi-clear");
  const status = document.querySelector("#midi-status");
  const suggestions = document.querySelector("#next-chord");
  const choices = document.querySelector("#next-chord-options");
  const noChoices = document.querySelector("#next-chord-empty");
  const storageKey = "jazz-lead-sheet:midi-chords";
  let access;
  let input;
  let recording = false;
  let chords = [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) {
      chords = saved.filter(notes => Array.isArray(notes) && notes.length >= 3 &&
        notes.every(note => Number.isInteger(note) && note >= 0 && note <= 127));
    }
  } catch {
    // Recording still works with storage disabled.
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(chords));
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }

  function render() {
    const names = pitchNames();
    list.replaceChildren(...chords.map((notes, index) => {
      const [label = "Unidentified chord", ...alternatives] = labelMidiChord(notes, names);
      const row = document.createElement("li");
      const playChord = document.createElement("button");
      const details = document.createElement("span");
      playChord.type = "button";
      playChord.textContent = label;
      playChord.setAttribute("aria-label", "Replay chord " + (index + 1) + " · " + label);
      playChord.addEventListener("click", () => audition(notes));
      const pitches = notes.map(note => names[note % 12] + (Math.floor(note / 12) - 1));
      details.textContent = pitches.join(" · ") +
        (alternatives.length ? " / Also " + alternatives.join(", ") : "");
      row.append(playChord, details);
      return row;
    }));
    clear.hidden = chords.length === 0;
    const nextChords = suggest(chords);
    suggestions.hidden = chords.length === 0;
    noChoices.hidden = nextChords.length > 0;
    choices.replaceChildren(...nextChords.map(({ name, reason, notes }) => {
      const row = document.createElement("li");
      const button = document.createElement("button");
      const explanation = document.createElement("span");
      button.type = "button";
      button.textContent = "Hear " + name;
      button.addEventListener("click", () => audition(notes));
      explanation.textContent = reason;
      row.append(button, explanation);
      return row;
    }));
  }

  const capture = createMidiCapture(notes => {
    chords.push(notes);
    save();
    render();
    status.textContent = "Recording · " + chords.length + (chords.length === 1 ? " chord" : " chords");
  });

  function stopRecording() {
    if (input) input.removeEventListener("midimessage", onMidi);
    capture.flush();
    recording = false;
    button.textContent = "Record MIDI";
    button.setAttribute("aria-pressed", "false");
    device.disabled = false;
    status.textContent = chords.length ? chords.length + (chords.length === 1 ? " chord recorded." : " chords recorded.") : "No chords recorded.";
  }

  function onMidi(event) {
    capture.receive(event.data);
  }

  function updateDevices() {
    if (recording && (!input || input.state === "disconnected")) {
      stopRecording();
      status.textContent = "MIDI keyboard disconnected.";
    }
    const previous = device.value;
    const inputs = [...access.inputs.values()].filter(port => port.state === "connected");
    device.replaceChildren(...inputs.map(port => new Option(port.name || "MIDI keyboard", port.id)));
    if (inputs.some(port => port.id === previous)) device.value = previous;
    deviceLabel.hidden = inputs.length === 0;
    if (!inputs.length && !recording) status.textContent = "Connect a MIDI keyboard, then press Record MIDI.";
  }

  button.addEventListener("click", async () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (!navigator.requestMIDIAccess) {
      status.textContent = "MIDI is unavailable here. Open this site in a browser with Web MIDI support.";
      return;
    }

    button.disabled = true;
    try {
      if (!access) {
        access = await navigator.requestMIDIAccess({ sysex: false });
        access.addEventListener("statechange", updateDevices);
      }
      updateDevices();
      input = access.inputs.get(device.value);
      if (!input) return;
      await input.open();
      if (input.state === "disconnected") {
        updateDevices();
        return;
      }
      input.addEventListener("midimessage", onMidi);
      recording = true;
      device.disabled = true;
      button.textContent = "Stop recording";
      button.setAttribute("aria-pressed", "true");
      status.textContent = "Recording · Play at least three notes together.";
    } catch {
      status.textContent = "Could not start MIDI. Check browser permission and the keyboard connection.";
    } finally {
      button.disabled = false;
    }
  });

  clear.addEventListener("click", () => {
    if (recording) stopRecording();
    chords = [];
    save();
    render();
    status.textContent = "Recording cleared.";
    button.focus();
  });
  render();
  return { render };
}
