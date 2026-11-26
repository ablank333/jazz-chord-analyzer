import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        if (args.length > 2 || (args.length == 2
                && !args[1].equalsIgnoreCase("major") && !args[1].equalsIgnoreCase("minor"))) {
            System.err.println("Usage: java Main [tonic [major|minor]]");
            System.exit(1);
        }

        String tonic = args.length == 0 ? "C" : args[0];
        boolean minor = args.length == 2 && args[1].equalsIgnoreCase("minor");
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.print("Input chords: ");
            if (scanner.hasNextLine()) {
                new AnalysisOutput().analyze(scanner.nextLine(), tonic, minor);
            }
        } catch (IllegalArgumentException error) {
            System.err.println(error.getMessage());
            System.exit(1);
        }
    }
}
