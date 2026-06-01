import java.util.ArrayList;
import java.util.List;

public class ChordParser {

    public List<Chord> parse(String chordsInput){
        List<Chord> chords = new ArrayList<>();
        String[] individualChords = chordsInput.split(" ");
        for (String individualChord : individualChords) {
            String root1Chars = individualChord.substring(0, 1);
            String suffixRoot1Chars = individualChord.substring(1);
            if (individualChord.length() > 1 && (individualChord.charAt(1) == 'b' ||
                    individualChord.charAt(1) == '#')) {
                String root2Chars = individualChord.substring(0, 2);
                String suffixRoot2Chars = individualChord.substring(2);
                chords.add(new Chord(root2Chars, suffixRoot2Chars));
            }
            else {
                chords.add(new Chord(root1Chars, suffixRoot1Chars));
            }
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
