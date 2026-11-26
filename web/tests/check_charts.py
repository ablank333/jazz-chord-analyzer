"""Check the published charts and voicings against the preset forms."""

import json
from pathlib import Path

from analyzer import parse_progression, pitch

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "dist" / "charts.js").read_text(encoding="utf-8")
CHARTS = json.loads(SOURCE.removeprefix("globalThis.CHARTS = ").strip().removesuffix(";"))
VOICING_CLASSES = {
    "7": {0, 4, 7, 10}, "m": {0, 3, 7}, "m(maj7)": {0, 3, 7, 11},
    "m7": {0, 3, 7, 10}, "m6": {0, 3, 7, 9}, "m9": {0, 2, 3, 10},
    "m7b5": {0, 3, 6, 10}, "13": {0, 4, 9, 10}, "maj7#11": {0, 4, 6, 11},
    "maj9": {0, 2, 4, 11}, "7alt": {0, 3, 4, 8, 10},
    "7#11": {0, 4, 6, 10}, "7b9": {0, 1, 4, 10},
}
FORMS = {
    ("C:major", "cadence"): "Dm9 G13 Cmaj7#11 Cmaj9",
    ("C:major", "turnaround"): "Cmaj9 A7alt Dm9 G13",
    ("C:major", "tritone"): "Dm9 Db7#11 Cmaj9 A7alt",
    ("F:major", "jazz-blues"): "F7 Bb7 F7 F7 Bb7 Bb7 F7 D7alt Gm9 C13 F7 C13",
    ("C:major", "secondary-dominants"): "Cmaj9 E7 Am7 D7 G13 Dm9 G13 Cmaj9",
    ("C:major", "backdoor"): "Fm9 Bb13 Cmaj9 Cmaj7#11",
    ("Bb:major", "rhythm-bridge"): "D7 D7 G7 G7 C7 C7 F7 F7",
    ("C:minor", "cadence"): "Dm7b5 G7b9 Cm9 Cm6",
    ("C:minor", "turnaround"): "Cm9 Abmaj7#11 Dm7b5 G7alt",
    ("C:minor", "tritone"): "Dm7b5 Db7#11 Cm9 G7alt",
    ("C:minor", "minor-line"): "Cm Cm(maj7) Cm7 Cm6",
}
REFERENCE_KEYS = {
    ("minor", name): key for key, name in FORMS if key.endswith(":minor")
} | {
    ("major", name): key for key, name in FORMS if key.endswith(":major")
}


def main():
    for (key, name), form in FORMS.items():
        expected = form.split()
        if len(expected) == 4:
            expected *= 2
        actual = [bar["symbol"] for bar in CHARTS[key][name]["bars"]]
        assert actual == expected, (key, name, actual)

    assert len(CHARTS) == 30
    chart_count = bar_count = 0
    for key, charts in CHARTS.items():
        tonic, mode = key.split(":")
        assert len(charts) == (4 if mode == "minor" else 7)
        for name, chart in charts.items():
            reference_key = REFERENCE_KEYS[mode, name]
            reference = CHARTS[reference_key][name]
            reference_tonic = reference_key.split(":")[0]
            transpose = pitch(tonic) - pitch(reference_tonic)
            bars = chart["bars"]
            assert len(bars) == (12 if name == "jazz-blues" else 8)
            assert chart["cadences"] == reference["cadences"]
            for bar, reference_bar in zip(bars, reference["bars"]):
                chord, = parse_progression(bar["symbol"])
                reference_chord, = parse_progression(reference_bar["symbol"])
                root = pitch(chord.root)
                assert chord.suffix == reference_chord.suffix, (key, name, bar)
                assert (root - pitch(reference_chord.root) - transpose) % 12 == 0, (key, name, bar)
                assert bar["roman"] == reference_bar["roman"], (key, name, bar)
                assert bar["roman"] != "?", (key, name, bar)
                assert bar["notes"][0] % 12 == root % 12, (key, name, bar)
                assert {(note - root) % 12 for note in bar["notes"]} == VOICING_CLASSES[chord.suffix], (key, name, bar)
                assert all(21 <= note <= 108 for note in bar["notes"]), (key, name, bar)
            if name == "minor-line":
                top = [max(bar["notes"]) for bar in bars[:4]]
                assert top == list(range(top[0], top[0] - 4, -1)), key
            chart_count += 1
            bar_count += len(bars)
    print(f"Verified {chart_count} charts and {bar_count} chord voicings.")


if __name__ == "__main__":
    main()
