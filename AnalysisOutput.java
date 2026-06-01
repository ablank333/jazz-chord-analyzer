import java.util.ArrayList;
import java.util.List;

public class AnalysisOutput {

    public void analyze(String input){
        ChordParser parser = new ChordParser();
        List<Chord> chords = parser.parse(input);
        RomanNumeralMapper mapper = new RomanNumeralMapper();
        List<String> romanNumerals = new ArrayList<>();

        // print list of chords
        System.out.print("Chords: ");
        for (Chord newChord : chords) {
            romanNumerals.add(mapper.map(newChord));
            System.out.print(newChord + " ");
        }
        System.out.println();

        // print list of roman numerals
        System.out.print("Roman numerals: ");
        for (String newRomanNumeral : romanNumerals){
            System.out.print(newRomanNumeral + " ");
        }
        System.out.println();

        PatternDetector detector = new PatternDetector();
        List<Integer> positions = detector.detect(romanNumerals);

        // print positions of pattern
        for (Integer newPosition : positions){
            System.out.println("ii-V-I detected at position " + newPosition);
        }
        System.out.println();
    }
}
