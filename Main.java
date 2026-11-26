import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        if (args.length > 1) {
            System.err.println("Usage: java Main [major-key]");
            System.exit(1);
        }

        String tonic = args.length == 0 ? "C" : args[0];
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.print("Input chords: ");
            if (scanner.hasNextLine()) {
                new AnalysisOutput().analyze(scanner.nextLine(), tonic);
            }
        } catch (IllegalArgumentException error) {
            System.err.println(error.getMessage());
            System.exit(1);
        }
    }
}
