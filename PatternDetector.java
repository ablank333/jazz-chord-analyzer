import java.util.ArrayList;
import java.util.List;
import java.util.function.IntPredicate;

public class PatternDetector {
    public List<Integer> detect(List<String> romanNumerals) {
        return detect(romanNumerals, position -> true);
    }

    List<Integer> detect(List<String> romanNumerals, List<Chord> chords) {
        return detect(romanNumerals, position -> {
            Chord dominant = chords.get(position + 1);
            Chord tonic = chords.get(position + 2);
            return (dominant.isMajorTriad() || dominant.quality() == Chord.Quality.DOMINANT)
                    && tonic.quality() == Chord.Quality.MAJOR;
        });
    }

    private List<Integer> detect(List<String> romanNumerals, IntPredicate hasCadenceQuality) {
        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i <= romanNumerals.size() - 3; i++) {
            if ("ii".equals(romanNumerals.get(i))
                    && "V".equals(romanNumerals.get(i + 1))
                    && "I".equals(romanNumerals.get(i + 2))
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
