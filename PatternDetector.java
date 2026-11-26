import java.util.ArrayList;
import java.util.List;
import java.util.function.IntPredicate;

public class PatternDetector {
    public List<Integer> detect(List<String> romanNumerals) {
        return detect(romanNumerals, "ii", "I", position -> true);
    }

    List<Integer> detect(List<String> romanNumerals, List<Chord> chords, boolean minor) {
        String supertonicNumeral = minor ? "iiø" : "ii";
        String tonicNumeral = minor ? "i" : "I";
        Chord.Quality tonicQuality = minor ? Chord.Quality.MINOR : Chord.Quality.MAJOR;
        return detect(romanNumerals, supertonicNumeral, tonicNumeral, position -> {
            Chord dominant = chords.get(position + 1);
            Chord tonic = chords.get(position + 2);
            return (dominant.isMajorTriad() || dominant.quality() == Chord.Quality.DOMINANT)
                    && tonic.quality() == tonicQuality;
        });
    }

    private List<Integer> detect(List<String> romanNumerals, String supertonic, String tonic,
                                 IntPredicate hasCadenceQuality) {
        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i <= romanNumerals.size() - 3; i++) {
            if (supertonic.equals(romanNumerals.get(i))
                    && "V".equals(romanNumerals.get(i + 1))
                    && tonic.equals(romanNumerals.get(i + 2))
                    && hasCadenceQuality.test(i)) {
                positions.add(i);
            }
        }
        return positions;
    }

    public static void main(String[] args) {
        PatternDetector detector = new PatternDetector();
        List<String> romanNumerals = new ArrayList<>();
        romanNumerals.add("ii");
        romanNumerals.add("V");
        romanNumerals.add("I");
        romanNumerals.add("vi");
        romanNumerals.add("ii");
        romanNumerals.add("V");
        romanNumerals.add("I");
        System.out.println(detector.detect(romanNumerals));
    }
}
