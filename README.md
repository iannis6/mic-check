# Mic Check

Quickly test your microphone directly from Raycast - record a short clip and play it back to verify audio quality.

## Features

- **Mic Check** - Record a 5-second audio clip and play it back instantly
- **Set Input Volume** - Quickly adjust microphone input volume with presets

## Commands

### Mic Check

Test your microphone with a quick record and playback workflow:

1. Press **R** to start recording (5 seconds)
2. Speak into your microphone
3. Press **Enter** to play back and hear yourself

### Set Input Volume

Adjust your microphone input volume:

- Enter a custom value (0-100)
- Use quick presets: Mute, Low, Medium, High, Maximum

## Requirements

- macOS 12.0 (Monterey) or later
- Microphone permission (prompted on first use)

## Installation

Install from the Raycast Store or build from source:

```bash
git clone https://github.com/your-username/mic-check
cd mic-check
npm install
npm run dev
```

## Technical Details

- Uses native Swift/AVFoundation for recording (no external dependencies)
- Recordings stored in Raycast support path (auto-cleaned)
- Uses AppleScript for volume control
- Uses built-in `afplay` for playback

## License

MIT
