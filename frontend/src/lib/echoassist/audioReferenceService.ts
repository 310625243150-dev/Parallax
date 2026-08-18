/**
 * Audio Reference Service
 *
 * Current Backend & ML Contract:
 * - The FastAPI backend expects `audio_reference: string` in `POST /api/examinations/analyze`.
 * - The backend ML pipeline (`predict_for_api(file_path)`) resolves this string to an audio file
 *   on the server and runs internal preprocessing and feature extraction directly on the ORIGINAL WAV.
 * - Browser-recorded audio is stored in ephemeral browser memory for local playback preview only.
 *   Browser-recorded audio is NOT yet ML-ready until persistent backend audio upload/storage is implemented.
 *
 * Benchmark Support:
 * - Direct reference to backend benchmark files (such as `a0001.wav`) is supported for testing
 *   the real ML pipeline without preprocessing.
 *
 * Remaining Integration Task:
 * - Persistent browser-audio upload endpoint (e.g. multipart/form-data upload or presigned S3 URL)
 *   so that newly recorded browser audio can be uploaded to backend storage before analysis.
 */

export const BENCHMARK_AUDIO_REFERENCE = "a0001.wav";

export interface AudioRecordingPayload {
  audioReference: string;
  durationSeconds: number;
  objectUrl?: string;
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
