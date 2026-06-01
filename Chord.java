public class Chord {
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

    // return string representation
    public String toString() {
        return getRoot() + getSuffix();
    }

    public static void main(String[] args) {
        Chord cMajor7 = new Chord("C", "maj7");
        System.out.println(cMajor7);
    }
}
