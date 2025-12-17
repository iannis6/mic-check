# Mic Check

Quickly test your microphone directly from Raycast — record a short clip and play it back to verify audio quality.

## Features

- **Quick Recording** — Record a 5-second audio clip with one keypress
- **Instant Playback** — Play back your recording to hear yourself
- **Live Countdown** — See recording progress in real-time (e.g., "Recording... 3s / 5s")
- **Input Device Display** — Shows your current microphone with status indicator
- **Zero Dependencies** — No Homebrew or external tools required

## Usage

1. Open Raycast and search for **Mic Check**
2. Press **Enter** to start recording
3. Wait for "Speak now..." then talk into your microphone
4. Press **Enter** to play back your recording
5. Listen and verify your audio quality

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Recording | `Enter` |
| Play Recording | `Enter` |
| Record Again | `Enter` (on "Record Again" item) |
| Stop Playback | `Esc` |
| Refresh Device Info | `Cmd+R` |

## Requirements

- macOS 12.0 (Monterey) or later
- Microphone permission (prompted on first use)

## Installation

Install from the [Raycast Store](https://raycast.com/iannis6/mic-check) or build from source:

```bash
git clone https://github.com/iannis6/mic-check
cd mic-check
npm install
npm run dev
```

## Technical Details

- Native Swift CLI using AVFoundation for recording
- `prepareToRecord()` for proper audio hardware initialization
- AppleScript for input device detection
- Built-in macOS `afplay` for playback
- Recordings stored in Raycast support path

## License

MIT
