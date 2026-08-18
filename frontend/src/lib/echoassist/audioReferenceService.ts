/**
 * Audio Reference Service
 *
 * Current Backend & ML Contract:
 * - The FastAPI backend expects `audio_reference: string` in `POST /api/examinations/analyze`.
 * - The backend ML pipeline (`predict_for_api(file_path)`) resolves this string to an audio file
 *   on the server and runs internal preprocessing and feature extraction directly on the ORIGINAL WAV.
 * - Browser-recorded audio is stored in ephemeral browser memory for local playback preview only.
 * - Original WAV file uploads are handled via `POST /api/audio/upload`, which saves the unmodified
 *   WAV to backend audio storage and returns an `audio_reference` string for analysis.
 *
 * Benchmark Support:
 * - Direct reference to backend benchmark files (such as `a0001.wav`) is supported for testing
 *   the real ML pipeline without preprocessing.
 */

export const BENCHMARK_AUDIO_REFERENCE = "a0001.wav";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface AudioRecordingPayload {
  audioReference: string;
  durationSeconds: number;
  objectUrl?: string;
  filename?: string;
}

/**
 * Validates selected file is a .wav file and does not exceed size limit.
 */
export function validateWavFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith(".wav")) {
    return { valid: false, error: "Only WAV (.wav) audio files are supported." };
  }
  if (file.size === 0) {
    return { valid: false, error: "The selected audio file is empty." };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 25MB maximum limit (${formatFileSize(file.size)}).`,
    };
  }
  return { valid: true };
}

/**
 * Formats byte count to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generates a structured audio reference identifier string based on location and timestamp.
 * Note: Preserves original raw audio format without frontend preprocessing.
 */
export function generateAudioReference(location: string, durationSeconds: number): string {
  const sanitizedLocation = (location || "auscultation").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const roundedDuration = Math.max(1, Math.round(durationSeconds));
  return `cardiac_${sanitizedLocation}_${stamp}_${roundedDuration}s.wav`;
}

/**
 * Creates a temporary object URL for local playback preview.
 * NOTE: This is ephemeral browser memory and must not be treated as persistent storage.
 */
export function createAudioPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revokes a temporary object URL to free browser resources.
 */
export function revokeAudioPreviewUrl(url?: string): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
