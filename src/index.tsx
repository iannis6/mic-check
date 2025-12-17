import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  Color,
} from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { getInputDevice } from "./utils/audio";
import {
  recordAudio,
  getRecordingPath,
  hasRecording,
  getDefaultDuration,
} from "./utils/recorder";
import { playAudio, stopPlayback } from "./utils/player";

type RecordingState =
  | "idle"
  | "preparing"
  | "recording"
  | "ready"
  | "playing"
  | "error";

export default function MicCheck() {
  const [inputDevice, setInputDevice] = useState<string>("");
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAudioInfo = useCallback(async () => {
    try {
      const device = await getInputDevice();
      setInputDevice(device || "Unknown Device");
    } catch {
      setInputDevice("Unable to detect");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudioInfo();
    if (hasRecording()) {
      setState("ready");
    }
  }, [loadAudioInfo]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime(0);
  }, []);

  const handleRecord = useCallback(async () => {
    setState("preparing");
    setErrorMessage("");

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Preparing",
      message: "Initializing microphone...",
    });

    try {
      await recordAudio(getDefaultDuration(), () => {
        // Called when recording actually starts
        setState("recording");
        startTimer();
        toast.title = "Recording";
        toast.message = "Speak now...";
      });
      stopTimer();
      setState("ready");
      toast.style = Toast.Style.Success;
      toast.title = "Recording Complete";
      toast.message = "Press Enter to play back";
    } catch (err) {
      stopTimer();
      const message = err instanceof Error ? err.message : "Recording failed";
      setState("error");
      setErrorMessage(message);
      toast.style = Toast.Style.Failure;
      toast.title = "Recording Failed";
      toast.message = message;
    }
  }, [startTimer, stopTimer]);

  const handlePlayback = useCallback(async () => {
    setState("playing");
    startTimer();

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Playing",
      message: "Listen for your voice...",
    });

    try {
      await playAudio(getRecordingPath());
      stopTimer();
      setState("ready");
      toast.style = Toast.Style.Success;
      toast.title = "Playback Complete";
      toast.message = "How did it sound?";
    } catch {
      stopTimer();
      setState("ready");
      toast.style = Toast.Style.Failure;
      toast.title = "Playback Failed";
    }
  }, [startTimer, stopTimer]);

  const handleStop = useCallback(async () => {
    await stopPlayback();
    stopTimer();
    setState("ready");
    await showToast({
      style: Toast.Style.Success,
      title: "Stopped",
    });
  }, [stopTimer]);

  const getStatusIcon = (): { source: Icon; tintColor: Color } => {
    switch (state) {
      case "preparing":
        return { source: Icon.Clock, tintColor: Color.Orange };
      case "recording":
        return { source: Icon.Dot, tintColor: Color.Red };
      case "playing":
        return { source: Icon.Play, tintColor: Color.Green };
      case "ready":
        return { source: Icon.CheckCircle, tintColor: Color.Green };
      case "error":
        return { source: Icon.XMarkCircle, tintColor: Color.Red };
      default:
        return { source: Icon.Microphone, tintColor: Color.PrimaryText };
    }
  };

  const duration = getDefaultDuration();

  const getStatusText = (): string => {
    switch (state) {
      case "preparing":
        return "Preparing microphone...";
      case "recording":
        return `Recording... ${elapsedTime}s / ${duration}s`;
      case "playing":
        return `Playing back... ${elapsedTime}s`;
      case "ready":
        return "Recording ready";
      case "error":
        return errorMessage || "An error occurred";
      default:
        return "Ready to test your microphone";
    }
  };

  const getStatusSubtitle = (): string | undefined => {
    switch (state) {
      case "idle":
        return `Press Enter to record ${duration} seconds`;
      case "ready":
        return "Press Enter to play back";
      case "error":
        return "Press Enter to try again";
      default:
        return undefined;
    }
  };

  // Primary action changes based on state
  const renderPrimaryAction = () => {
    switch (state) {
      case "playing":
        return (
          <Action
            title="Stop Playback"
            icon={Icon.Stop}
            onAction={handleStop}
            shortcut={{ key: "escape", modifiers: [] }}
          />
        );
      case "error":
        return (
          <Action
            title="Try Again"
            icon={Icon.ArrowClockwise}
            onAction={handleRecord}
          />
        );
      case "preparing":
      case "recording":
        return null; // No action during preparation or recording
      default:
        return (
          <Action
            title="Start Recording"
            icon={Icon.Microphone}
            onAction={handleRecord}
          />
        );
    }
  };

  return (
    <List isLoading={isLoading}>
      <List.Section title={state === "ready" ? "Recording Ready" : "Status"}>
        {state === "ready" ? (
          <>
            <List.Item
              icon={{ source: Icon.Play, tintColor: Color.Green }}
              title="Play Recording"
              subtitle="Listen to your test"
              actions={
                <ActionPanel>
                  <Action
                    title="Play Recording"
                    icon={Icon.Play}
                    onAction={handlePlayback}
                  />
                </ActionPanel>
              }
            />
            <List.Item
              icon={{ source: Icon.Microphone, tintColor: Color.Blue }}
              title="Record Again"
              subtitle="Create a new recording"
              actions={
                <ActionPanel>
                  <Action
                    title="Record Again"
                    icon={Icon.Microphone}
                    onAction={handleRecord}
                  />
                </ActionPanel>
              }
            />
          </>
        ) : (
          <List.Item
            icon={getStatusIcon()}
            title={getStatusText()}
            subtitle={getStatusSubtitle()}
            actions={<ActionPanel>{renderPrimaryAction()}</ActionPanel>}
          />
        )}
      </List.Section>

      <List.Section title="Audio Input">
        <List.Item
          icon={Icon.Microphone}
          title="Input Device"
          subtitle={inputDevice}
          accessories={[
            {
              icon:
                inputDevice && inputDevice !== "Unable to detect"
                  ? { source: Icon.CheckCircle, tintColor: Color.Green }
                  : { source: Icon.XMarkCircle, tintColor: Color.Red },
              tooltip:
                inputDevice && inputDevice !== "Unable to detect"
                  ? "Device detected"
                  : "No device",
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={loadAudioInfo}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Help">
        <List.Item
          icon={Icon.QuestionMark}
          title="How to use"
          subtitle="Record → Play → Listen for your voice"
          accessories={[
            { tag: { value: `${duration}s`, color: Color.SecondaryText } },
          ]}
        />
      </List.Section>
    </List>
  );
}
