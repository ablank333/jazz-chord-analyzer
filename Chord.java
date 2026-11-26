import java.util.regex.Pattern;

public class Chord {
    enum Quality {
        MAJOR, MINOR, DOMINANT, DIMINISHED, HALF_DIMINISHED, UNKNOWN
    }

    private static final Pattern MAJOR_TRIAD = Pattern.compile("maj|M|Δ|");
    private static final Pattern MAJOR = Pattern.compile("(?:maj|M|Δ)(?:7|9|11|13)|6");
    private static final Pattern MINOR = Pattern.compile("(?:m|min|-)(?:6|7|9|11|13)?");
    private static final Pattern DOMINANT = Pattern.compile("(?:7|9|11|13)(?:[b#](?:5|9|11|13))*");
    private static final Pattern DIMINISHED = Pattern.compile("(?:dim|°|o)7?");
    private final String root; // root of chord
    private final String suffix; // suffix of chord

    public Chord(String root, String suffix){
        this.root = root;
        this.suffix = suffix;
    }

    // get root string
    public String getRoot(){
        return root;
    }

    // get suffix string
    public String getSuffix(){
        return suffix;
    }

    boolean isMajorTriad() {
        return MAJOR_TRIAD.matcher(suffix).matches();
    }

    Quality quality() {
        if (isMajorTriad() || MAJOR.matcher(suffix).matches()) {
            return Quality.MAJOR;
        }
        if (MINOR.matcher(suffix).matches()) {
            return Quality.MINOR;
        }
        if (DOMINANT.matcher(suffix).matches()) {
            return Quality.DOMINANT;
        }
        if (DIMINISHED.matcher(suffix).matches()) {
            return Quality.DIMINISHED;
        }
        if (suffix.equals("m7b5") || suffix.equals("ø") || suffix.equals("ø7")) {
            return Quality.HALF_DIMINISHED;
        }
        return Quality.UNKNOWN;
    }

    // return string representation
    public String toString() {
        return getRoot() + getSuffix();
    }

    public static void main(String[] args) {
        Chord cMajor7 = new Chord("C", "maj7");
        System.out.println(cMajor7);
    }
}
