import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/lib/echoassist/format";
import { WaveformBars } from "@/components/echoassist/Waveform";
import {
  createAudioPreviewUrl,
  generateAudioReference,
  revokeAudioPreviewUrl,
  type AudioRecordingPayload,
} from "@/lib/echoassist/audioReferenceService";

export type RecordingResult = AudioRecordingPayload;

/**
 * Produces an audio_reference string (the backend analyze endpoint accepts a string reference).
 * The recorded audio blob is kept exclusively in browser memory for immediate local playback and review.
 */
export function AudioRecorder({
  onComplete,
  location,
}: {
  onComplete: (result: RecordingResult) => void;
  location: string;
}) {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function finish(objectUrl?: string) {
    const duration = seconds || Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    const audioReference = generateAudioReference(location, duration);
    onComplete({
      audioReference,
      durationSeconds: duration,
      ...(objectUrl ? { objectUrl } : {}),
    });
  }

  async function start() {
    setError(null);
    setSeconds(0);
    startedAtRef.current = Date.now();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/wav" });
        finish(createAudioPreviewUrl(blob));
      };
      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
      startTimer();
    } catch {
      // Graceful fallback if microphone permissions are denied or unavailable
      setError("Microphone unavailable. Recording will be simulated with a timed reference.");
      setState("recording");
      startTimer();
    }
  }

  function togglePause() {
    const recorder = recorderRef.current;
    if (state === "recording") {
      if (recorder?.state === "recording") {
        recorder.pause();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setState("paused");
    } else {
      if (recorder?.state === "paused") {
        recorder.resume();
      }
      startTimer();
      setState("recording");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    setState("idle");
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      recorderRef.current = null;
    } else {
      finish();
    }
  }

  const recording = state === "recording";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <button
          type="button"
          onClick={state === "idle" ? start : stop}
          aria-label={state === "idle" ? "Start Recording" : "Stop recording"}
          className={cn(
            "grid h-32 w-32 place-items-center rounded-full border-4 transition-colors",
            state === "idle"
              ? "border-secondary/30 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              : "border-destructive/30 bg-destructive text-destructive-foreground",
          )}
          style={recording ? { animation: "ea-pulse-ring 1.6s ease-out infinite" } : undefined}
        >
          {state === "idle" ? (
            <Mic className="h-10 w-10" aria-hidden />
          ) : (
            <Square className="h-9 w-9" aria-hidden />
          )}
        </button>
      </div>

      <p className="mt-4 text-sm font-medium">
        {state === "idle" ? "Start Recording" : state === "paused" ? "Paused" : "Recording..."}
      </p>
      <p
        className="mt-1 font-mono text-2xl tabular-nums"
        aria-live="polite"
        aria-label="Recording duration"
      >
        {formatSeconds(seconds)}
      </p>

      <div className="mt-5 w-full rounded-xl border border-border bg-primary/[0.03] p-4">
        <WaveformBars active={state === "recording"} />
      </div>

      {state !== "idle" ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={togglePause}>
            {state === "paused" ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )}
            {state === "paused" ? "Resume" : "Pause"}
          </Button>
          <Button variant="destructive" onClick={stop}>
            <Square className="h-4 w-4" aria-hidden />
            Stop
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 max-w-sm text-center text-xs text-warning-foreground">{error}</p>
      ) : null}
    </div>
  );
}

export function AudioReviewCard({
  audioReference,
  durationSeconds,
  objectUrl,
  onRetake,
}: {
  audioReference: string;
  durationSeconds: number;
  objectUrl?: string;
  onRetake: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        revokeAudioPreviewUrl(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <div>
      <div className="rounded-xl border border-border bg-primary/[0.03] p-4">
        <WaveformBars seed={19} />
      </div>
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          aria-label={playing ? "Pause audio" : "Play audio"}
          disabled={!objectUrl}
          onClick={() => {
            const el = audioRef.current;
            if (!el) return;
            if (playing) {
              el.pause();
              setPlaying(false);
            } else {
              void el.play();
              setPlaying(true);
            }
          }}
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{audioReference}</p>
          <p className="text-xs text-muted-foreground">
            Duration {formatSeconds(durationSeconds)}
            {objectUrl ? " · Local preview ready" : " · Local playback preview unavailable"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetake} className="shrink-0">
          <RotateCcw className="h-4 w-4" aria-hidden />
          Retake
        </Button>
      </div>
      {objectUrl ? (
        <audio
          ref={audioRef}
          src={objectUrl}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      ) : null}
    </div>
  );
}
