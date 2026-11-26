import re
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CliRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        build = tempfile.TemporaryDirectory()
        cls.addClassCleanup(build.cleanup)
        cls.classes = build.name
        subprocess.run(
            ["javac", "--release", "11", "-Xlint:all", "-encoding", "UTF-8",
             "-d", cls.classes, *sorted(ROOT.glob("*.java"))],
            check=True,
        )

    def run_cli(self, chords, *args):
        return subprocess.run(
            ["java", "-Dfile.encoding=UTF-8", "-cp", self.classes, "Main", *args],
            input=chords, encoding="utf-8", capture_output=True, timeout=10,
        )

    def assert_analysis(self, chords, args, numerals, cadences):
        result = self.run_cli(chords + "\n", *args)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        self.assertIn("Roman numerals: " + numerals, result.stdout.splitlines())
        self.assertEqual(
            re.findall(r"^(.+) detected at position (\d+)$", result.stdout, re.MULTILINE),
            [(label, str(position)) for label, position in cadences],
        )

    def test_major_progressions(self):
        cases = [
            ("Dm7 G7 C", (), "ii V I", [0]),
            ("   Cm7 → F7 → Bbmaj7", ("Bb",), "ii V I", [0]),
            ("G#m7->C#7\tF#maj7 G#m9 C#7b9 F#", ("F#",), "ii V I ii V I", [0, 3]),
            ("Bbmaj7 F#dim7 Bm7b5 Cfoo Dm7 G7 C", (), "bVII #iv° viiø ? ii V I", [4]),
            ("D7 G7 C Dm7 Gm7 C Dm7 Gmaj7 C Dm7 G7 Cm7 Dm7 G7 C7", (),
             "II V I ii v I ii V I ii V i ii V I", []),
            ("Dm7 Gmaj C", ("C", "major"), "ii V I", [0]),
            ("Bm7b5 E7 Am7", ("A",), "iiø V i", []),
        ]
        for chords, args, numerals, positions in cases:
            with self.subTest(chords=chords, args=args):
                self.assert_analysis(chords, args, numerals, [("ii-V-I", p) for p in positions])

    def test_minor_progressions(self):
        cases = [
            ("Bm7b5 → E7b9 → Am7", ("A", "minor"), "iiø V i", [0]),
            ("F#ø7 B7 Em6 F#ø B Em(maj7)", ("E", "minor"), "iiø V i iiø V i", [0, 3]),
            ("Cø7 F7 Bbm", ("Bb", "minor"), "iiø V i", [0]),
            ("Am C F G G#dim7", ("A", "minor"), "i III VI VII #vii°", []),
            ("Bm7 E7 Am Bdim7 E7 Am Bm7b5 Em7 Am Bm7b5 Emaj7 Am Bm7b5 E7 A",
             ("A", "minor"), "ii V i ii° V i iiø v i iiø V i iiø V I", []),
        ]
        for chords, args, numerals, positions in cases:
            with self.subTest(chords=chords, args=args):
                self.assert_analysis(chords, args, numerals, [("iiø-V-i", p) for p in positions])

    def test_invalid_input(self):
        cases = [
            (" \t \n", (), "Enter at least one chord."),
            ("Dm7 → → C\n", (), "Invalid chord symbol"),
            ("Qm7 G7 C\n", (), "Invalid chord symbol"),
            ("Dm7 G7 C\n", ("H",), "Invalid major key: H."),
            ("Bm7b5 E7 Am\n", ("H", "minor"), "Invalid minor key: H."),
            ("Dm7 G7 C\n", ("C", "dorian"), "Usage: java Main"),
        ]
        for chords, args, error in cases:
            with self.subTest(chords=chords, args=args):
                result = self.run_cli(chords, *args)
                self.assertEqual(result.returncode, 1, result)
                self.assertIn(error, result.stderr)
                self.assertNotIn("Exception", result.stderr)

    def test_end_of_input(self):
        result = self.run_cli("")
        self.assertEqual(result.returncode, 0, result)
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
