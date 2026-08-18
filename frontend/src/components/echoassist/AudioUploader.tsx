import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  UploadCloud,
  FileAudio,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/echoassist/api";
import {
  createAudioPreviewUrl,
  formatFileSize,
  validateWavFile,
  type AudioRecordingPayload,
} from "@/lib/echoassist/audioReferenceService";
import { WaveformBars } from "@/components/echoassist/Waveform";

export interface AudioUploaderProps {
  onComplete: (payload: AudioRecordingPayload) => void;
  onCancel?: () => void;
}

export function AudioUploader({ onComplete, onCancel }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedRef, setUploadedRef] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileSelect(selectedFile: File) {
    setError(null);
    setUploadedRef(null);

    const validation = validateWavFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0 && droppedFiles[0]) {
      handleFileSelect(droppedFiles[0]);
    }
  }

  function removeFile() {
    setFile(null);
    setError(null);
    setUploadedRef(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const response = await api.uploadAudio(file);
      setUploadedRef(response.audio_reference);
      const previewUrl = createAudioPreviewUrl(file);

      // Estimate audio duration based on file size or default 10s
      const estimatedDuration = Math.max(1, Math.round(file.size / 88200)) || 10;

      onComplete({
        audioReference: response.audio_reference,
        durationSeconds: estimatedDuration,
        objectUrl: previewUrl,
        filename: file.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload audio file. Please try again.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,audio/wav,audio/x-wav"
        onChange={onFileInputChange}
        className="hidden"
        aria-label="Upload WAV audio file"
      />

      {!file ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver
              ? "border-secondary bg-secondary/10"
              : "border-border bg-card hover:border-secondary/50 hover:bg-accent/40"
          }`}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary/10 text-secondary">
            <UploadCloud className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Click to upload or drag & drop a WAV audio file
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports original WAV auscultation files up to 25MB (no frontend preprocessing applied)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select WAV File
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary/10 text-secondary">
              <FileAudio className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · Original WAV file
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isUploading}
              onClick={removeFile}
              aria-label="Remove selected file"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div className="mt-4 rounded-lg bg-primary/[0.03] p-3 text-secondary">
            <WaveformBars seed={14} active={false} />
          </div>

          {uploadedRef ? (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>Uploaded to backend storage as {uploadedRef}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Replace File
            </Button>
            <Button type="button" size="sm" disabled={isUploading} onClick={handleUpload}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Uploading WAV...
                </>
              ) : (
                <>
                  Upload & Continue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
