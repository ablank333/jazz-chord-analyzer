"""Build the static chart library with the Python analyzer."""

import json
from itertools import combinations, product
from pathlib import Path

from analyzer import LETTERS, MAJOR_SCALE, MINOR_SCALE, cadence_positions, parse_progression, pitch, roman_numerals

KEYS = {
    "major": "Cb Gb Db Ab Eb Bb F C G D A E B F# C#".split(),
    "minor": "Ab Eb Bb F C G D A E B F# C# G# D# A#".split(),
}
RECIPES = {
    "major": {
        "cadence": [(2, 0, "m9"), (5, 0, "13"), (1, 0, "maj7#11"), (1, 0, "maj9")] * 2,
        "turnaround": [(1, 0, "maj9"), (6, 0, "7alt"), (2, 0, "m9"), (5, 0, "13")] * 2,
        "tritone": [(2, 0, "m9"), (2, -1, "7#11"), (1, 0, "maj9"), (6, 0, "7alt")] * 2,
        "jazz-blues": [
            (1, 0, "7"), (4, 0, "7"), (1, 0, "7"), (1, 0, "7"),
            (4, 0, "7"), (4, 0, "7"), (1, 0, "7"), (6, 0, "7alt"),
            (2, 0, "m9"), (5, 0, "13"), (1, 0, "7"), (5, 0, "13"),
        ],
        "secondary-dominants": [
            (1, 0, "maj9"), (3, 0, "7"), (6, 0, "m7"), (2, 0, "7"),
            (5, 0, "13"), (2, 0, "m9"), (5, 0, "13"), (1, 0, "maj9"),
        ],
        "backdoor": [(4, 0, "m9"), (7, -1, "13"), (1, 0, "maj9"), (1, 0, "maj7#11")] * 2,
        "rhythm-bridge": [(degree, 0, "7") for degree in (3, 6, 2, 5) for _ in range(2)],
    },
    "minor": {
        "cadence": [(2, 0, "m7b5"), (5, 0, "7b9"), (1, 0, "m9"), (1, 0, "m6")] * 2,
        "turnaround": [(1, 0, "m9"), (6, 0, "maj7#11"), (2, 0, "m7b5"), (5, 0, "7alt")] * 2,
        "tritone": [(2, 0, "m7b5"), (2, -1, "7#11"), (1, 0, "m9"), (5, 0, "7alt")] * 2,
        "minor-line": [(1, 0, suffix) for suffix in ("m", "m(maj7)", "m7", "m6")] * 2,
    },
}

VOICINGS = {
    "7": (0, 16, 19, 22),
    "m": (0, 15, 19, 24),
    "m(maj7)": (0, 15, 19, 23),
    "m7": (0, 15, 19, 22),
    "m9": (0, 15, 22, 26),
    "13": (0, 16, 22, 33),
    "maj7#11": (0, 16, 23, 30),
    "maj9": (0, 16, 23, 26),
    "7alt": (0, 16, 22, 27, 32),
    "7#11": (0, 16, 22, 30),
    "m7b5": (0, 15, 18, 22),
    "7b9": (0, 16, 22, 25),
    "m6": (0, 15, 19, 21),
}


# Pitch classes above the root. Shells retain the bass and guide tones.
SHELL_TONES = {
    "7": (4, 10), "m": (3, 7), "m(maj7)": (3, 11), "m7": (3, 10),
    "m9": (3, 10), "13": (4, 10), "maj7#11": (4, 11), "maj9": (4, 11),
    "7alt": (4, 10), "7#11": (4, 10), "m7b5": (3, 10),
    "7b9": (4, 10), "m6": (3, 9),
}
ROOTLESS_TONES = {
    "7": (4, 7, 10), "m": (3, 7), "m(maj7)": (3, 7, 11),
    "m7": (3, 7, 10), "m9": (2, 3, 7, 10), "13": (2, 4, 9, 10),
    "maj7#11": (4, 6, 7, 11), "maj9": (2, 4, 7, 11),
    "7alt": (3, 4, 8, 10), "7#11": (4, 6, 7, 10),
    "m7b5": (3, 6, 10), "7b9": (1, 4, 7, 10), "m6": (3, 7, 9),
}


def motion_score(previous, current):
    common = set(previous) & set(current)
    left = tuple(note for note in previous if note not in common)
    right = tuple(note for note in current if note not in common)
    if len(left) > len(right):
        left, right = right, left
    distance = min(sum(abs(a - b) for a, b in zip(left, subset))
                   for subset in combinations(right, len(left)))
    return -len(common), distance


def choose_voicing(root, intervals, previous, floor, ceiling, center):
    choices = [
        [note for note in range(floor, ceiling + 1) if note % 12 == (root + interval) % 12]
        for interval in intervals
    ]
    candidates = [tuple(sorted(notes)) for notes in product(*choices)]

    def score(notes):
        span = notes[-1] - notes[0]
        return (max(0, span - 12), *motion_score(previous, notes),
                abs(sum(notes) - center * len(notes)), span, notes)

    return min(candidates, key=score)


def degree_root(tonic, scale, degree, change):
    letter = LETTERS[(LETTERS.index(tonic[0]) + degree - 1) % 7]
    alteration = (pitch(tonic) + scale[degree - 1] + change - pitch(letter) + 6) % 12 - 6
    return letter + ("b" * -alteration if alteration < 0 else "#" * alteration)


def build_chart(tonic, mode, recipe):
    scale = MINOR_SCALE if mode == "minor" else MAJOR_SCALE
    symbols = [degree_root(tonic, scale, degree, change) + suffix
               for degree, change, suffix in recipe]
    chords = parse_progression(" ".join(symbols))
    labels = roman_numerals(chords, tonic, mode)
    if "?" in labels:
        raise ValueError(f"Analyzer could not label {symbols}")
    cadences = cadence_positions(chords, labels, mode)
    bars = []
    previous_shell = previous_rootless = ()
    for index, chord in enumerate(chords):
        root = 43 + (pitch(chord.root) - 43) % 12
        previous_shell = choose_voicing(root, SHELL_TONES[chord.suffix], previous_shell,
                                        max(50, root + 1), 74, 57)
        previous_rootless = choose_voicing(root, ROOTLESS_TONES[chord.suffix], previous_rootless,
                                            48, 74, 60)
        bars.append({"symbol": str(chord), "roman": labels[index],
                     "notes": [root + interval for interval in VOICINGS[chord.suffix]],
                     "shell": (root, *previous_shell), "rootless": previous_rootless})
    return {"bars": bars, "cadences": cadences}


def main():
    charts = {
        f"{tonic}:{mode}": {
            kind: build_chart(tonic, mode, recipe)
            for kind, recipe in RECIPES[mode].items()
        }
        for mode, keys in KEYS.items() for tonic in keys
    }
    output = Path(__file__).parent / "dist" / "charts.js"
    output.write_text("globalThis.CHARTS = " + json.dumps(charts, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Built {sum(map(len, charts.values()))} charts from {len(charts)} keys.")


if __name__ == "__main__":
    main()
