import java.util.ArrayList;
import java.util.List;

public class PatternDetector {

    public List<Integer> detect(List<String> romanNumerals) {
        List<Integer> storePositions = new ArrayList<>();
        for (int i = 0; i <= romanNumerals.size() - 3; i++){
            if ((romanNumerals.get(i).equals("ii")) &&
                    (romanNumerals.get(i+1).equals("V"))
                    && (romanNumerals.get(i+2).equals("I"))){
                storePositions.add(i);
            }
        }
        return storePositions;
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
