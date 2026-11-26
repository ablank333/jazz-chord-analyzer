import java.util.ArrayList;
import java.util.List;

public class AnalysisOutput {
    public void analyze(String input) {
        analyze(input, "C");
    }

    public void analyze(String input, String tonic) {
        analyze(input, tonic, false);
    }

    public void analyze(String input, String tonic, boolean minor) {
        ChordParser parser = new ChordParser();
        List<Chord> chords = parser.parse(input);
        RomanNumeralMapper mapper = new RomanNumeralMapper(tonic, minor);
        List<String> romanNumerals = new ArrayList<>();

        System.out.print("Chords:");
        for (Chord chord : chords) {
            romanNumerals.add(mapper.map(chord));
            System.out.print(" " + chord);
        }
        System.out.println();
        System.out.println("Roman numerals: " + String.join(" ", romanNumerals));

        PatternDetector detector = new PatternDetector();
        String cadence = minor ? "iiø-V-i" : "ii-V-I";
        for (int position : detector.detect(romanNumerals, chords, minor)) {
            System.out.println(cadence + " detected at position " + position);
        }
        System.out.println();
    }
}
