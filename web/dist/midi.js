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

const RECORDED_LABEL = /^[A-G](?:[b♭]{1,2}|[#♯]{1,2}|𝄫|𝄪)?[A-Za-z0-9+#♭♯ø°Δ()\/-]*$/u;

function readRecordedBars(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap(entry => {
    const bar = Array.isArray(entry) ? { notes: entry } : entry;
    if (!Array.isArray(bar?.notes) || bar.notes.length < 3 ||
        !bar.notes.every(note => Number.isInteger(note) && note >= 0 && note <= 127)) return [];
    const label = typeof bar.label === "string" && bar.label.length <= 24 && RECORDED_LABEL.test(bar.label)
      ? bar.label : "";
    return [{ notes: bar.notes, label }];
  });
}

function setupMidiRecorder({ pitchNames, renderChord, suggest, audition }) {
  const button = document.querySelector("#midi-record");
  const device = document.querySelector("#midi-device");
  const deviceLabel = document.querySelector("#midi-device-label");
  const list = document.querySelector("#midi-chords");
  const sheet = document.querySelector("#recorded-sheet");
  const editor = document.querySelector("#recorded-editor");
  const labelInput = document.querySelector("#recorded-label");
  const earlier = document.querySelector("#recorded-earlier");
  const later = document.querySelector("#recorded-later");
  const remove = document.querySelector("#recorded-delete");
  const notesLabel = document.querySelector("#recorded-notes");
  const update = document.querySelector("#recorded-update");
  const clear = document.querySelector("#midi-clear");
  const status = document.querySelector("#midi-status");
  const suggestions = document.querySelector("#next-chord");
  const choices = document.querySelector("#next-chord-options");
  const noChoices = document.querySelector("#next-chord-empty");
  const storageKey = "jazz-lead-sheet:midi-chords";
  let access;
  let input;
  let recording = false;
  let bars = [];
  let selectedBar = 0;
  let previousSuggestions = "";

  try {
    bars = readRecordedBars(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Recording still works with storage disabled.
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bars));
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }

  function renderEditor(bar, labels, names) {
    labelInput.value = bar.label;
    labelInput.placeholder = labels[0] || "e.g. Dm7";
    labelInput.setCustomValidity("");
    earlier.disabled = selectedBar === 0;
    later.disabled = selectedBar === bars.length - 1;
    const pitches = bar.notes.map(note => names[note % 12] + (Math.floor(note / 12) - 1));
    const alternatives = labels.filter(label => label !== (bar.label || labels[0]));
    notesLabel.textContent = pitches.join(" · ") +
      (alternatives.length ? " / Also " + alternatives.join(", ") : "");
  }

  function renderBar(bar, index, names) {
    const [inferred] = labelMidiChord(bar.notes, names);
    const label = bar.label || inferred;
    const cell = document.createElement("button");
    const number = document.createElement("span");
    const symbol = document.createElement("span");
    cell.type = "button";
    cell.className = "measure";
    cell.setAttribute("aria-pressed", String(index === selectedBar));
    cell.setAttribute("aria-label", "Recorded bar " + (index + 1) + ": " + (label || "Unidentified chord"));
    number.className = "measure-number";
    number.textContent = index + 1;
    symbol.className = label ? "symbol" : "recorded-unknown";
    if (label) renderChord(symbol, label);
    else symbol.textContent = "Unknown";
    cell.append(number, symbol);
    cell.addEventListener("click", () => {
      selectedBar = index;
      render();
      list.children[index].focus();
      audition(bar.notes);
    });
    return cell;
  }

  function commit(message, focusBar = false) {
    save();
    render();
    update.textContent = message;
    if (focusBar) (list.children[selectedBar] || button).focus();
  }

  function render(preserveLabel = false) {
    const names = pitchNames();
    sheet.hidden = bars.length === 0;
    list.replaceChildren(...bars.map((bar, index) => renderBar(bar, index, names)));
    if (bars.length && !preserveLabel) {
      const bar = bars[selectedBar];
      renderEditor(bar, labelMidiChord(bar.notes, names), names);
    }
    if (preserveLabel) later.disabled = selectedBar === bars.length - 1;
    clear.hidden = bars.length === 0;
    const nextChords = suggest(bars);
    suggestions.hidden = bars.length === 0;
    noChoices.hidden = nextChords.length > 0;
    const signature = nextChords.map(({ name, reason }) => name + reason).join("|");
    if (signature === previousSuggestions) return;
    previousSuggestions = signature;
    choices.replaceChildren(...nextChords.map(({ name, reason, notes }) => {
      const row = document.createElement("li");
      const title = document.createElement("h4");
      const actions = document.createElement("div");
      const hear = document.createElement("button");
      const add = document.createElement("button");
      const explanation = document.createElement("p");
      title.textContent = name;
      hear.type = add.type = "button";
      hear.textContent = "Hear";
      add.textContent = "Add";
      hear.setAttribute("aria-label", "Hear " + name);
      add.setAttribute("aria-label", "Add " + name);
      hear.addEventListener("click", () => audition(notes));
      add.addEventListener("click", () => {
        selectedBar = bars.length;
        bars.push({ notes, label: name });
        commit("Added " + name + " to bar " + (selectedBar + 1) + ".", true);
      });
      explanation.textContent = reason;
      actions.className = "suggestion-actions";
      actions.append(hear, add);
      row.append(title, explanation, actions);
      return row;
    }));
  }

  labelInput.addEventListener("input", () => labelInput.setCustomValidity(""));
  editor.addEventListener("submit", event => {
    event.preventDefault();
    const label = labelInput.value.trim().replace(/^[a-g]/, root => root.toUpperCase());
    if (label && !RECORDED_LABEL.test(label)) {
      labelInput.setCustomValidity("Enter a chord symbol such as Dm7 or B♭7.");
      labelInput.reportValidity();
      return;
    }
    bars[selectedBar].label = label;
    commit(label ? "Saved " + label + "." : "Restored the recognized label.", true);
  });

  function moveBar(step) {
    const destination = selectedBar + step;
    if (destination < 0 || destination >= bars.length) return;
    [bars[selectedBar], bars[destination]] = [bars[destination], bars[selectedBar]];
    selectedBar = destination;
    commit("Moved chord to bar " + (selectedBar + 1) + ".", true);
  }

  earlier.addEventListener("click", () => moveBar(-1));
  later.addEventListener("click", () => moveBar(1));
  remove.addEventListener("click", () => {
    const deleted = selectedBar + 1;
    bars.splice(selectedBar, 1);
    selectedBar = Math.max(0, Math.min(selectedBar, bars.length - 1));
    commit("Deleted bar " + deleted + ".", true);
  });

  const capture = createMidiCapture(notes => {
    bars.push({ notes, label: "" });
    save();
    render(document.activeElement === labelInput);
    status.textContent = "Recording · " + bars.length + (bars.length === 1 ? " chord" : " chords");
  });

  function stopRecording() {
    if (input) input.removeEventListener("midimessage", onMidi);
    capture.flush();
    recording = false;
    button.textContent = "Record MIDI";
    button.setAttribute("aria-pressed", "false");
    device.disabled = false;
    render();
    status.textContent = bars.length ? bars.length + (bars.length === 1 ? " chord recorded." : " chords recorded.") : "No chords recorded.";
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
    bars = [];
    selectedBar = 0;
    save();
    render();
    status.textContent = "Recording cleared.";
    button.focus();
  });
  render();
  return { render };
}
