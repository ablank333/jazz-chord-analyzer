import java.util.Locale;

public class RomanNumeralMapper {
    private static final String LETTERS = "CDEFGAB";
    private static final String[] DEGREES = {"I", "II", "III", "IV", "V", "VI", "VII"};
    private static final int[] MAJOR_SCALE = {0, 2, 4, 5, 7, 9, 11};

    private final int tonicLetter;
    private final int tonicPitch;

    public RomanNumeralMapper() {
        this("C");
    }

    public RomanNumeralMapper(String tonic) {
        if (!tonic.matches("[A-G][b#]?")) {
            throw new IllegalArgumentException("Invalid major key: " + tonic + ".");
        }
        tonicLetter = LETTERS.indexOf(tonic.charAt(0));
        tonicPitch = pitch(tonic, tonicLetter);
    }

    public String map(Chord chord) {
        String root = chord.getRoot();
        if (!root.matches("[A-G][b#]?")) {
            return "?";
        }
        int letter = LETTERS.indexOf(root.charAt(0));
        int degree = Math.floorMod(letter - tonicLetter, DEGREES.length);
        int expectedPitch = tonicPitch + MAJOR_SCALE[degree];
        int alteration = Math.floorMod(pitch(root, letter) - expectedPitch + 6, 12) - 6;
        String accidental = alteration < 0 ? "b".repeat(-alteration) : "#".repeat(alteration);
        String numeral = DEGREES[degree];

        switch (chord.quality()) {
            case MINOR:
                return accidental + numeral.toLowerCase(Locale.ROOT);
            case DIMINISHED:
                return accidental + numeral.toLowerCase(Locale.ROOT) + "°";
            case HALF_DIMINISHED:
                return accidental + numeral.toLowerCase(Locale.ROOT) + "ø";
            case MAJOR:
            case DOMINANT:
                return accidental + numeral;
            default:
                return "?";
        }
    }

    private static int pitch(String note, int letter) {
        int pitch = MAJOR_SCALE[letter];
        if (note.length() == 2) {
            pitch += note.charAt(1) == '#' ? 1 : -1;
        }
        return pitch;
    }

    public static void main(String[] args) {
        RomanNumeralMapper mapper = new RomanNumeralMapper();
        Chord chord = new Chord("B", "dim");
        System.out.println(mapper.map(chord));
    }
}
