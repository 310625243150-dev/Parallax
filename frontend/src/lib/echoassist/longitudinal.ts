import type { Examination, Patient } from "./types";
import { formatDateTime } from "./format";

/**
 * Safely converts confidence to percentage (0 - 100).
 * Handles 0-1 range vs already-percentage values without double-conversion.
 */
export function safeConfidencePercent(confidence: number | null | undefined): number {
  if (confidence === null || confidence === undefined || isNaN(confidence)) {
    return 0;
  }
  if (confidence <= 1.0) {
    return Math.round(confidence * 1000) / 10;
  }
  return Math.round(confidence * 10) / 10;
}

/**
 * Maps categorical signal quality to visualization score and color.
 * Labeled explicitly as a visualization score.
 */
export function mapSignalQuality(quality: string | null | undefined): {
  score: number;
  label: string;
  color: string;
} {
  const normalized = (quality || "").trim().toLowerCase();

  if (["good", "pass", "high"].includes(normalized)) {
    return { score: 100, label: "Good", color: "#16a34a" };
  }
  if (["acceptable", "fair", "moderate", "medium"].includes(normalized)) {
    return { score: 60, label: "Acceptable", color: "#d97706" };
  }
  if (["poor", "fail", "low"].includes(normalized)) {
    return { score: 25, label: "Poor", color: "#dc2626" };
  }
  return { score: 50, label: quality || "Unknown", color: "#64748b" };
}

export interface TrendMetrics {
  totalExaminations: number;
  currentPrediction: string;
  previousPrediction: string | null;
  avgConfidence: number;
  highestConfidence: number;
  lowestConfidence: number;
  avgSignalQualityScore: number;
  trendStatus: "Improving" | "Stable" | "Needs Attention" | "Baseline Established";
  trendDetails: string;
}

/**
 * Calculates deterministic trend statistics from chronological examination history.
 * Chronological order expected: oldest first to newest last.
 */
export function calculateTrendMetrics(examinations: Examination[]): TrendMetrics | null {
  if (!examinations || examinations.length === 0) return null;

  // Ensure chronological order (oldest to newest)
  const sorted = [...examinations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const totalExaminations = sorted.length;
  const currentExam = sorted[sorted.length - 1];
  if (!currentExam) return null;

  const previousExam = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const confidences = sorted.map((e) => safeConfidencePercent(e.confidence));
  const avgConfidence =
    Math.round((confidences.reduce((sum, c) => sum + c, 0) / confidences.length) * 10) / 10;
  const highestConfidence = Math.max(...confidences);
  const lowestConfidence = Math.min(...confidences);

  const qualityScores = sorted.map((e) => mapSignalQuality(e.signal_quality).score);
  const avgSignalQualityScore =
    Math.round((qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length) * 10) / 10;

  const currentDiag = (currentExam.diagnosis || "").toLowerCase();
  const prevDiag = (previousExam?.diagnosis || "").toLowerCase();

  let trendStatus: TrendMetrics["trendStatus"] = "Stable";
  let trendDetails = "Findings remain consistent across examinations.";

  if (!previousExam) {
    trendStatus = "Baseline Established";
    trendDetails = "Initial baseline examination recorded.";
  } else {
    const isCurrentNormal = currentDiag.includes("normal") && !currentDiag.includes("abnormal");
    const isPrevNormal = prevDiag.includes("normal") && !prevDiag.includes("abnormal");

    if (!isPrevNormal && isCurrentNormal) {
      trendStatus = "Improving";
      trendDetails = `Diagnosis transitioned from ${previousExam.diagnosis} to ${currentExam.diagnosis}.`;
    } else if (isPrevNormal && !isCurrentNormal) {
      trendStatus = "Needs Attention";
      trendDetails = `Diagnosis shifted from ${previousExam.diagnosis} to ${currentExam.diagnosis}.`;
    } else if (!isPrevNormal && !isCurrentNormal) {
      if (currentDiag !== prevDiag) {
        trendStatus = "Needs Attention";
        trendDetails = `Diagnosis pattern changed from ${previousExam.diagnosis} to ${currentExam.diagnosis}.`;
      } else {
        trendStatus = "Stable";
        trendDetails = `Persistent finding: ${currentExam.diagnosis}.`;
      }
    } else {
      trendStatus = "Stable";
      trendDetails = "Normal heart sound maintained across examinations.";
    }
  }

  return {
    totalExaminations,
    currentPrediction: currentExam.diagnosis,
    previousPrediction: previousExam ? previousExam.diagnosis : null,
    avgConfidence,
    highestConfidence,
    lowestConfidence,
    avgSignalQualityScore,
    trendStatus,
    trendDetails,
  };
}

/**
 * Builds CSV content client-side from patient information and examination history.
 */
export function generateHistoryCsv(patient: Patient, examinations: Examination[]): string {
  const headers = [
    "Examination ID",
    "Timestamp",
    "Patient ID",
    "Patient Name",
    "Patient Age",
    "Diagnosis",
    "Confidence (%)",
    "Signal Quality",
    "Recording Duration",
    "Model Version",
    "Audio Reference",
    "Doctor Notes",
  ];

  const sorted = [...examinations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const escapeCsv = (val: unknown) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sorted.map((exam) => [
    escapeCsv(exam.id),
    escapeCsv(formatDateTime(exam.timestamp)),
    escapeCsv(patient.id),
    escapeCsv(patient.name),
    escapeCsv(patient.age),
    escapeCsv(exam.diagnosis),
    escapeCsv(safeConfidencePercent(exam.confidence)),
    escapeCsv(exam.signal_quality),
    escapeCsv("Not available"),
    escapeCsv(exam.model_version),
    escapeCsv(exam.audio_reference),
    escapeCsv(exam.notes || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Initiates client-side file download for generated text/csv.
 */
export function downloadFile(filename: string, content: string, mimeType = "text/csv"): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
