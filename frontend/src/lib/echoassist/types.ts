export interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: string | null;
  medical_history?: string | null;
  created_at?: string;
}

export interface PatientCreate {
  id?: string;
  name: string;
  age: number;
  gender?: string;
  medical_history?: string;
}

export type NewPatientInput = PatientCreate;

export interface AnalyzeInput {
  patient_id: string;
  audio_reference: string;
  notes?: string;
}

export interface Examination {
  id: number;
  patient_id: string;
  timestamp: string;
  audio_reference: string;
  diagnosis: string;
  confidence: number;
  signal_quality: string;
  model_version: string;
  notes?: string | null;
}

export interface Comparison {
  patient_id: string;
  has_previous: boolean;
  previous_diagnosis?: string | null;
  previous_confidence?: number | null;
  current_diagnosis?: string | null;
  current_confidence?: number | null;
  change_detected?: boolean | null;
  details?: string | null;
}

export interface AnalysisResult {
  examination: Examination;
  comparison: Comparison;
}
