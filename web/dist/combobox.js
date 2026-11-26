"use strict";

function searchText(value) {
  return value.toLowerCase().trim()
    .replaceAll("♯", "#").replaceAll("♭", "b")
    .replace(/\b([a-g])\s*flat\b/g, "$1b")
    .replace(/\b([a-g])\s*sharp\b/g, "$1#")
    .replace(/[-–—]/g, "");
}

function createCombobox(id, initialValue, options, onSelect) {
  const input = document.getElementById(id);
  const popup = document.getElementById(id + "-popup");
  const list = document.getElementById(id + "-options");
  const empty = document.getElementById(id + "-empty");
  let value = initialValue;
  let matches = [];
  let active = -1;
  let editing = false;

  function selection() {
    return options().find(option => option.value === value);
  }

  function close() {
    popup.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    input.value = selection().label;
    active = -1;
    editing = false;
  }

  function highlight(index, scroll = true) {
    active = index;
    for (const [position, item] of Array.from(list.children).entries()) {
      item.dataset.active = String(position === index);
    }
    if (index < 0) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    const item = list.children[index];
    input.setAttribute("aria-activedescendant", item.id);
    if (scroll) item.scrollIntoView({ block: "nearest" });
  }

  function choose(option) {
    const changed = value !== option.value;
    value = option.value;
    close();
    if (changed) onSelect();
    input.select();
  }

  function show(query) {
    const words = searchText(query).split(/\s+/).filter(Boolean);
    matches = options().filter(option => {
      const terms = searchText(option.label).split(/\s+/);
      return words.every(word => terms.some(term => term.startsWith(word)));
    });
    list.replaceChildren(...matches.map((option, index) => {
      const item = document.createElement("li");
      item.id = id + "-option-" + index;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.value === value));
      item.textContent = option.label;
      item.addEventListener("mousedown", event => event.preventDefault());
      item.addEventListener("click", () => choose(option));
      return item;
    }));
    popup.hidden = false;
    empty.hidden = matches.length > 0;
    input.setAttribute("aria-expanded", "true");
    highlight(query && matches.length ? 0 : -1, false);
    list.scrollTop = 0;
  }

  input.addEventListener("focus", () => {
    input.select();
    show("");
  });
  input.addEventListener("click", () => {
    if (popup.hidden) show("");
    if (!editing) input.select();
  });
  input.addEventListener("input", () => {
    editing = true;
    show(input.value);
  });
  input.addEventListener("blur", close);
  input.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (popup.hidden) show("");
      if (!matches.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = active < 0 && step < 0 ? matches.length - 1 : active + step;
      highlight(Math.max(0, Math.min(matches.length - 1, next)));
    } else if (event.key === "Enter" && !popup.hidden) {
      event.preventDefault();
      if (active >= 0) choose(matches[active]);
    } else if (event.key === "Escape" && !popup.hidden) {
      event.preventDefault();
      close();
      input.select();
    }
  });

  close();
  return {
    selection,
    refresh(fallbackValue) {
      if (!selection()) value = fallbackValue;
      close();
    }
  };
}
