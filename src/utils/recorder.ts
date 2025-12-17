import { execa } from "execa";
import { environment } from "@raycast/api";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";

const RECORDING_FILENAME = "mic-test.wav";
const DEFAULT_DURATION = 5; // seconds

/**
 * Get the path to the mic-recorder binary
 */
function getBinaryPath(): string {
  return join(environment.assetsPath, "mic-recorder");
}

/**
 * Get the path where recordings are stored
 */
export function getRecordingPath(): string {
  return join(environment.supportPath, RECORDING_FILENAME);
}

/**
 * Check if a recording exists
 */
export function hasRecording(): boolean {
  return existsSync(getRecordingPath());
}

/**
 * Delete the existing recording if it exists
 */
export function deleteRecording(): void {
  const path = getRecordingPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

/**
 * Record audio from the microphone
 * @param duration Duration in seconds (default: 5)
 * @param onRecordingStarted Callback when recording actually starts (after mic initialization)
 * @returns Path to the recorded file
 * @throws Error if recording fails
 */
export async function recordAudio(
  duration: number = DEFAULT_DURATION,
  onRecordingStarted?: () => void,
): Promise<string> {
  const binaryPath = getBinaryPath();
  const outputPath = getRecordingPath();

  // Delete any existing recording
  deleteRecording();

  return new Promise((resolve, reject) => {
    const subprocess = execa(binaryPath, [outputPath, String(duration)], {
      timeout: (duration + 10) * 1000, // Add buffer for startup/shutdown
    });

    let stdoutData = "";
    let recordingStarted = false;

    subprocess.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutData += text;

      // Check if recording has started
      if (!recordingStarted && text.includes("RECORDING")) {
        recordingStarted = true;
        onRecordingStarted?.();
      }
    });

    subprocess.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.includes("ERROR:")) {
        // Will be handled in the catch block
      }
    });

    subprocess
      .then((result) => {
        if (!stdoutData.includes("OK")) {
          deleteRecording();
          reject(new Error(result.stderr || "Recording failed"));
          return;
        }

        // Verify the file was created
        if (!existsSync(outputPath)) {
          reject(new Error("Recording file was not created"));
          return;
        }

        resolve(outputPath);
      })
      .catch((error) => {
        // Clean up partial recording if it exists
        deleteRecording();

        if (error instanceof Error) {
          // Check for common errors
          if (error.message.includes("Microphone access denied")) {
            reject(
              new Error(
                "Microphone access denied. Please enable in System Settings > Privacy & Security > Microphone",
              ),
            );
            return;
          }
          reject(error);
          return;
        }
        reject(new Error("Recording failed unexpectedly"));
      });
  });
}

/**
 * Get the default recording duration
 */
export function getDefaultDuration(): number {
  return DEFAULT_DURATION;
}
