// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "MicRecorder",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(
            name: "mic-recorder",
            path: "Sources/MicRecorder"
        )
    ]
)
