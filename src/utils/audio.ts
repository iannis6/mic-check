import { runAppleScript } from "run-applescript";

/**
 * Get the name of the current default input device
 */
export async function getInputDevice(): Promise<string> {
  try {
    // Try to get the default input device name from system_profiler
    const result = await runAppleScript(`
      do shell script "system_profiler SPAudioDataType 2>/dev/null | grep -A 20 'Input:' | grep 'Default:' | head -1 | sed 's/.*Default: //' | xargs || echo 'Unknown'"
    `);
    const trimmed = result.trim();

    if (trimmed && trimmed !== "" && trimmed !== "Unknown") {
      return trimmed;
    }

    // Fallback: try alternative approach
    const fallback = await runAppleScript(`
      do shell script "system_profiler SPAudioDataType 2>/dev/null | grep -A 5 'Input:' | grep 'Device:' | head -1 | sed 's/.*Device: //' | xargs || echo 'Built-in Microphone'"
    `);
    return fallback.trim() || "Built-in Microphone";
  } catch {
    return "Unknown Device";
  }
}
