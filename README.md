Jazz Chord Progression Analyzer
- A Java-based symbolic music analysis tool that parses jazz chord progressions and identifies functional harmonic structures.

What it does
- Parses chord progression strings using tokenization (e.g. "Cm7 → F7 → Bbmaj7")
- Classifies each chord using hash map–based Roman numeral analysis
- Detects ii–V–I harmonic sequences using a sliding window algorithm
- Outputs a full harmonic analysis of the progression

Technical details
- Built with object-oriented design — each stage is an independent module
- Pipeline architecture: Input → Parse → Map → Analyze → Output
- O(n) end-to-end complexity

How to run
- Compile and run Main.java in any Java IDE (e.g. IntelliJ IDEA).
