import java.util.HashMap;

public class RomanNumeralMapper {

    // declares HashMap
    HashMap<String, String> map = new HashMap<>();

    // constructor
    public RomanNumeralMapper(){
        map.put("C", "I");
        map.put("D", "ii");
        map.put("E", "iii");
        map.put("F", "IV");
        map.put("G", "V");
        map.put("A", "vi");
        map.put("B", "vii°");
    }

    // takes chord and returns roman numeral
    public String map(Chord chord) {
        String root = chord.getRoot();
        return map.get(root);
    }

    public static void main(String[] args) {
        RomanNumeralMapper mapper = new RomanNumeralMapper();
        Chord chord = new Chord("B", "dim");
        System.out.println(mapper.map(chord));
    }
}
