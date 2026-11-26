import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ChordParser {
    private static final Pattern SYMBOL = Pattern.compile("([A-G][b#]?)(.*)");

    public List<Chord> parse(String chordsInput) {
        String input = chordsInput.strip();
        if (input.isEmpty()) {
            throw new IllegalArgumentException("Enter at least one chord.");
        }

        List<Chord> chords = new ArrayList<>();
        for (String symbol : input.split("\\s*(?:→|->)\\s*|\\s+", -1)) {
            Matcher match = SYMBOL.matcher(symbol);
            if (!match.matches()) {
                throw new IllegalArgumentException("Invalid chord symbol: \"" + symbol + "\".");
            }
            chords.add(new Chord(match.group(1), match.group(2)));
        }
        return chords;
    }

    public static void main(String[] args) {
        ChordParser parser = new ChordParser();
        List<Chord> chords = parser.parse("Dm7 G7 C Bbmaj7 Em");
        for (Chord newChord : chords){
            System.out.println(newChord);
        }
    }
}
