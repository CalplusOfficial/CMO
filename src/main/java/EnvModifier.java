package main.java;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Paths;

public class EnvModifier {
    /**
     * Creates or updates a .env file in the project root directory.
     * @param content The content to write to the .env file.
     * @throws IOException if file operations fail.
     */
    public static void createOrUpdateEnvFile(String content) throws IOException {
        // Get the current working directory (assumed to be project root when running jar)
        String projectRoot = System.getProperty("user.dir");
        File envFile = Paths.get(projectRoot, ".env").toFile();

        try (FileWriter writer = new FileWriter(envFile, false)) {
            writer.write(content);
        }
    }

    /*
    public static void main(String[] args) {
        String exampleContent = "EXAMPLE_KEY=example_value\n";
        try {
            createOrUpdateEnvFile(exampleContent);
            System.out.println(".env file created/updated in project root.");
        } catch (IOException e) {
            System.err.println("Failed to create/update .env file: " + e.getMessage());
        }
    }
    */
}
