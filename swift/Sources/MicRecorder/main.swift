import AVFoundation
import Foundation

class MicRecorder: NSObject, AVAudioRecorderDelegate {
    private var audioRecorder: AVAudioRecorder?
    private let outputPath: String
    private let duration: Double
    private var isFinished = false
    private var recordingError: Error?

    init(outputPath: String, duration: Double) {
        self.outputPath = outputPath
        self.duration = duration
        super.init()
    }

    func startRecording() -> Bool {
        let url = URL(fileURLWithPath: outputPath)

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsBigEndianKey: false
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.delegate = self

            // Pre-warm the audio hardware - this reduces startup latency
            // by creating the audio file and preparing the system
            guard audioRecorder?.prepareToRecord() == true else {
                fputs("ERROR: Failed to prepare recording\n", stderr)
                return false
            }

            // Start recording - should be near-instant since we prepared
            guard audioRecorder?.record(forDuration: duration) == true else {
                fputs("ERROR: Failed to start recording\n", stderr)
                return false
            }

            // Small delay to ensure audio hardware is actually capturing samples
            // This prevents the first ~100-150ms of audio from being lost
            Thread.sleep(forTimeInterval: 0.15)

            // Signal that recording has actually started and is capturing
            print("RECORDING")
            fflush(stdout)

            // Use RunLoop to wait - this allows delegate callbacks to fire
            let deadline = Date(timeIntervalSinceNow: duration + 2.0)
            while !isFinished && Date() < deadline {
                RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
            }

            // Cleanup
            audioRecorder?.stop()
            audioRecorder = nil

            if !isFinished {
                fputs("ERROR: Recording timed out\n", stderr)
                return false
            }

            if let error = recordingError {
                fputs("ERROR: \(error.localizedDescription)\n", stderr)
                return false
            }

            // Verify file was created
            if !FileManager.default.fileExists(atPath: outputPath) {
                fputs("ERROR: Recording file was not created\n", stderr)
                return false
            }

            return true

        } catch {
            fputs("ERROR: \(error.localizedDescription)\n", stderr)
            return false
        }
    }

    // MARK: - AVAudioRecorderDelegate

    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if !flag {
            recordingError = NSError(domain: "MicRecorder", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Recording did not complete successfully"
            ])
        }
        isFinished = true
    }

    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        recordingError = error
        isFinished = true
    }
}

// MARK: - CLI Entry Point

func printUsage() {
    fputs("Usage: mic-recorder <output-path> <duration-seconds>\n", stderr)
}

let args = CommandLine.arguments

guard args.count >= 3 else {
    printUsage()
    exit(1)
}

let outputPath = args[1]

guard !outputPath.contains("..") else {
    fputs("ERROR: Invalid output path\n", stderr)
    exit(1)
}

guard let duration = Double(args[2]), duration > 0, duration <= 30 else {
    fputs("ERROR: Duration must be between 0 and 30 seconds\n", stderr)
    exit(1)
}

// Check microphone permission
switch AVCaptureDevice.authorizationStatus(for: .audio) {
case .authorized:
    break
case .notDetermined:
    let semaphore = DispatchSemaphore(value: 0)
    AVCaptureDevice.requestAccess(for: .audio) { granted in
        semaphore.signal()
        if !granted {
            fputs("ERROR: Microphone access denied\n", stderr)
            exit(2)
        }
    }
    semaphore.wait()
case .denied, .restricted:
    fputs("ERROR: Microphone access denied. Enable in System Settings → Privacy & Security → Microphone\n", stderr)
    exit(2)
@unknown default:
    fputs("ERROR: Unknown permission status\n", stderr)
    exit(2)
}

let recorder = MicRecorder(outputPath: outputPath, duration: duration)
if recorder.startRecording() {
    print("OK")
    exit(0)
} else {
    exit(1)
}
