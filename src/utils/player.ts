import { execa } from "execa";
import { existsSync } from "fs";

/**
 * Play an audio file using macOS built-in afplay
 * @param filePath Path to the audio file to play
 * @throws Error if playback fails or file doesn't exist
 */
export async function playAudio(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    throw new Error("Audio file not found");
  }

  try {
    await execa("afplay", [filePath]);
  } catch (error) {
    // afplay was killed (e.g., by stopPlayback) - not an error
    if (error instanceof Error && error.message.includes("SIGTERM")) {
      return;
    }
    throw new Error("Playback failed");
  }
}

/**
 * Stop any currently playing audio
 */
export async function stopPlayback(): Promise<void> {
  try {
    await execa("killall", ["afplay"], {
      reject: false, // Don't throw if afplay isn't running
    });
  } catch {
    // Ignore errors - afplay might not be running
  }
}

/**
 * Play audio with a specified volume
 * @param filePath Path to the audio file
 * @param volume Volume level (0-1, where 1 is normal)
 */
export async function playAudioWithVolume(
  filePath: string,
  volume: number,
): Promise<void> {
  if (!existsSync(filePath)) {
    throw new Error("Audio file not found");
  }

  const clampedVolume = Math.max(0, Math.min(1, volume));

  try {
    await execa("afplay", ["-v", String(clampedVolume), filePath]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("SIGTERM")) {
      return;
    }
    throw new Error("Playback failed");
  }
}
