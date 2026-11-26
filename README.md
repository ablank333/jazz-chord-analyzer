# Jazz Chord Progression Analyzer

A Python command-line tool that labels chord progressions with Roman numerals in a supplied key. It detects ii–V–I in major keys and iiø–V–i in minor keys.

## Project rule

AI tools may assist with writing and reviewing the code. The application must run locally and use deterministic music-theory rules for all analysis. AI models, machine learning, and AI services are excluded from the application, including future features such as key suggestions.

## Run

From the repository root with Python 3.9 or later, run:

```sh
python3 analyzer.py
```

The default key is C major. Pass a tonic such as `Bb` or `F#` to analyze in another major key:

```sh
printf 'Cm7 → F7 → Bbmaj7\n' | python3 analyzer.py Bb
```

```text
Input chords: Chords: Cm7 F7 Bbmaj7
Roman numerals: ii V I
ii-V-I detected at position 0
```

All 15 standard major-key spellings and all 15 standard minor-key spellings are supported, including enharmonic pairs such as C-flat and B major. Enter roots and tonics as uppercase letters with optional accidentals. ASCII `b`, `#`, `bb`, and `##` and musical symbols `♭`, `♯`, `𝄫`, and `𝄪` are accepted.

Separate chords with spaces, tabs, `→`, or `->`. The analyzer recognizes common major, minor, dominant, diminished, and half-diminished symbols, such as `Cmaj7`, `Cm9`, `C7b9`, `Cdim7`, and `Cm7b5`. Unsupported chord qualities display as `?`. Cadence positions are zero-based and mark the starting chord.

## Minor keys

Pass the tonic followed by `minor`:

```sh
printf 'Bm7b5 → E7b9 → Am7\n' | python3 analyzer.py A minor
```

```text
Input chords: Chords: Bm7b5 E7b9 Am7
Roman numerals: iiø V i
iiø-V-i detected at position 0
```

The analyzer uses one key for the whole progression. Minor-key numerals use the natural minor scale for degree labels, so G#dim7 in A minor is `#vii°`. Both cadence types accept a major triad or dominant chord on V. The minor cadence requires a half-diminished ii and a minor tonic.

## Regression checks

Run `python3 tests/cli_regression.py -v` with Python 3.9 or later. GitHub Actions runs the same suite on pull requests and pushes to `main`.
