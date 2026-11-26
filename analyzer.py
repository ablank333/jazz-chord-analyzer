"""Label chord progressions and detect cadences in a supplied key."""

import re
import sys
from dataclasses import dataclass


ROOT = r"[A-G](?:[b♭]{1,2}|[#♯]{1,2}|𝄫|𝄪)?"
CHORD_SYMBOL = re.compile(rf"({ROOT})(.*)")
SEPARATOR = re.compile(r"\s*(?:→|->)\s*|\s+")
LETTERS = "CDEFGAB"
DEGREES = ("I", "II", "III", "IV", "V", "VI", "VII")
MAJOR_SCALE = (0, 2, 4, 5, 7, 9, 11)
MINOR_SCALE = (0, 2, 3, 5, 7, 8, 10)
ACCIDENTALS = str.maketrans({"♯": "#", "♭": "b", "𝄪": "##", "𝄫": "bb"})
MAJOR_TRIADS = {"", "maj", "M", "Δ"}
QUALITY_PATTERNS = (
    ("major", re.compile(r"(?:maj|M|Δ)(?:7|9|11|13)|6")),
    ("minor", re.compile(r"(?:m|min|-)(?:6|7|9|11|13)?|m(?:Maj7|maj7|M7|\(maj7\))")),
    ("dominant", re.compile(r"(?:7|9|11|13)(?:[b#](?:5|9|11|13))*")),
    ("diminished", re.compile(r"(?:dim|°|o)7?")),
    ("half-diminished", re.compile(r"m7b5|ø7?")),
)


@dataclass(frozen=True)
class Chord:
    root: str
    suffix: str
    quality: str

    def __str__(self) -> str:
        return self.root + self.suffix


def chord_quality(suffix: str) -> str:
    if suffix in MAJOR_TRIADS:
        return "major"
    for quality, pattern in QUALITY_PATTERNS:
        if pattern.fullmatch(suffix):
            return quality
    return "unknown"


def parse_progression(progression: str) -> list[Chord]:
    progression = progression.strip()
    if not progression:
        raise ValueError("Enter at least one chord.")

    chords = []
    for symbol in SEPARATOR.split(progression):
        match = CHORD_SYMBOL.fullmatch(symbol)
        if match is None:
            raise ValueError(f'Invalid chord symbol: "{symbol}".')
        root, suffix = match.groups()
        chords.append(Chord(root, suffix, chord_quality(suffix)))
    return chords


def pitch(note: str) -> int:
    accidental = note[1:].translate(ACCIDENTALS)
    return MAJOR_SCALE[LETTERS.index(note[0])] + accidental.count("#") - accidental.count("b")


def roman_numerals(chords: list[Chord], tonic: str, mode: str) -> list[str]:
    if not re.fullmatch(ROOT, tonic):
        raise ValueError(f"Invalid {mode} key: {tonic}.")

    scale = MINOR_SCALE if mode == "minor" else MAJOR_SCALE
    tonic_letter = LETTERS.index(tonic[0])
    tonic_pitch = pitch(tonic)
    numerals = []
    for chord in chords:
        if chord.quality == "unknown":
            numerals.append("?")
            continue

        degree = (LETTERS.index(chord.root[0]) - tonic_letter) % len(DEGREES)
        expected_pitch = tonic_pitch + scale[degree]
        alteration = (pitch(chord.root) - expected_pitch + 6) % 12 - 6
        accidental = "b" * -alteration if alteration < 0 else "#" * alteration
        numeral = DEGREES[degree]
        if chord.quality in {"minor", "diminished", "half-diminished"}:
            numeral = numeral.lower()
        if chord.quality == "diminished":
            numeral += "°"
        elif chord.quality == "half-diminished":
            numeral += "ø"
        numerals.append(accidental + numeral)
    return numerals


def cadence_positions(chords: list[Chord], numerals: list[str], mode: str) -> list[int]:
    expected = ["iiø", "V", "i"] if mode == "minor" else ["ii", "V", "I"]
    positions = []
    for index in range(len(chords) - 2):
        if numerals[index:index + 3] != expected:
            continue
        dominant, tonic = chords[index + 1:index + 3]
        if (dominant.suffix in MAJOR_TRIADS or dominant.quality == "dominant") and tonic.quality == mode:
            positions.append(index)
    return positions


def main(args: list[str]) -> int:
    tonic = args[0] if args else "C"
    mode = args[1].lower() if len(args) >= 2 else "major"
    if len(args) > 2 or mode not in {"major", "minor"}:
        print("Usage: python3 analyzer.py [tonic [major|minor]]", file=sys.stderr)
        return 1

    try:
        progression = input("Input chords: ")
        chords = parse_progression(progression)
        numerals = roman_numerals(chords, tonic, mode)
    except EOFError:
        return 0
    except ValueError as error:
        print(error, file=sys.stderr)
        return 1

    print("Chords:", *chords)
    print("Roman numerals:", *numerals)
    label = "iiø-V-i" if mode == "minor" else "ii-V-I"
    for position in cadence_positions(chords, numerals, mode):
        print(f"{label} detected at position {position}")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
