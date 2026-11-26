# Jazz Chord Progression Analyzer

A Java command-line tool that labels chord progressions with Roman numerals in a supplied key. It detects ii–V–I in major keys and iiø–V–i in minor keys.

## Run

From the repository root with JDK 11 or later, compile and run:

```sh
javac -encoding UTF-8 *.java
java Main
```

The default key is C major. Pass a tonic such as `Bb` or `F#` to analyze in another major key:

```sh
printf 'Cm7 → F7 → Bbmaj7\n' | java Main Bb
```

```text
Input chords: Chords: Cm7 F7 Bbmaj7
Roman numerals: ii V I
ii-V-I detected at position 0
```

Separate chords with spaces, tabs, `→`, or `->`. Use uppercase roots with optional ASCII `b` or `#`. The analyzer recognizes common major, minor, dominant, diminished, and half-diminished symbols, such as `Cmaj7`, `Cm9`, `C7b9`, `Cdim7`, and `Cm7b5`. Unsupported chord qualities display as `?`. Cadence positions are zero-based and mark the starting chord.

## Minor keys

Pass the tonic followed by `minor`:

```sh
printf 'Bm7b5 → E7b9 → Am7\n' | java Main A minor
```

```text
Input chords: Chords: Bm7b5 E7b9 Am7
Roman numerals: iiø V i
iiø-V-i detected at position 0
```

The analyzer uses one key for the whole progression. Minor-key numerals use the natural minor scale for degree labels, so G#dim7 in A minor is `#vii°`. Both cadence types accept a major triad or dominant chord on V. The minor cadence requires a half-diminished ii and a minor tonic.

## Regression checks

Run `python3 tests/cli_regression.py -v` with JDK 11 or later and Python 3. GitHub Actions runs the same suite on pull requests and pushes to `main`.
