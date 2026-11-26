# Jazz Chord Progression Analyzer

A Java command-line tool that labels chord progressions with Roman numerals in a supplied major key and detects ii–V–I cadences.

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

The analyzer uses the supplied key for the whole progression. Cadence detection covers a minor ii, a major-triad or dominant V, and a major I.
