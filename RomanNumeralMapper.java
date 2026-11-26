import java.util.Locale;

public class RomanNumeralMapper {
    private static final String LETTERS = "CDEFGAB";
    private static final String[] DEGREES = {"I", "II", "III", "IV", "V", "VI", "VII"};
    private static final int[] MAJOR_SCALE = {0, 2, 4, 5, 7, 9, 11};
    private static final int[] NATURAL_MINOR_SCALE = {0, 2, 3, 5, 7, 8, 10};

    private final int[] scale;
    private final int tonicLetter;
    private final int tonicPitch;

    public RomanNumeralMapper() {
        this("C");
    }

    public RomanNumeralMapper(String tonic) {
        this(tonic, false);
    }

    public RomanNumeralMapper(String tonic, boolean minor) {
        if (!tonic.matches(Chord.ROOT_PATTERN)) {
            String mode = minor ? "minor" : "major";
            throw new IllegalArgumentException("Invalid " + mode + " key: " + tonic + ".");
        }
        scale = minor ? NATURAL_MINOR_SCALE : MAJOR_SCALE;
        tonicLetter = LETTERS.indexOf(tonic.charAt(0));
        tonicPitch = pitch(tonic, tonicLetter);
    }

    public String map(Chord chord) {
        String root = chord.getRoot();
        if (!root.matches(Chord.ROOT_PATTERN)) {
            return "?";
        }
        int letter = LETTERS.indexOf(root.charAt(0));
        int degree = Math.floorMod(letter - tonicLetter, DEGREES.length);
        int expectedPitch = tonicPitch + scale[degree];
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
        int naturalPitch = MAJOR_SCALE[letter];
        String accidental = note.substring(1)
                .replace("♯", "#").replace("♭", "b")
                .replace("𝄪", "##").replace("𝄫", "bb");
        if (accidental.startsWith("#")) {
            return naturalPitch + accidental.length();
        }
        return naturalPitch - accidental.length();
    }

    public static void main(String[] args) {
        RomanNumeralMapper mapper = new RomanNumeralMapper();
        Chord chord = new Chord("B", "dim");
        System.out.println(mapper.map(chord));
    }
}
