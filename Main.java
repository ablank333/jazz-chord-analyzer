import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        AnalysisOutput output = new AnalysisOutput();

        System.out.print("Input chords: ");

        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();

        output.analyze(input);
        }
    }
