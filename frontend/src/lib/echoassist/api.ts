import type {
  AnalysisResult,
  AnalyzeInput,
  Comparison,
  Examination,
  Patient,
  PatientCreate,
} from "./types";

export const API_BASE_URL: string = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ??
  (import.meta.env["VITE_ECHOASSIST_API_URL"] as string | undefined) ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Unable to connect to EchoAssist backend.", 0);
  }

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    let errorJson: unknown;
    try {
      errorJson = await res.json();
      if (
        errorJson &&
        typeof errorJson === "object" &&
        "detail" in errorJson &&
        typeof (errorJson as { detail: unknown }).detail === "string"
      ) {
        errorDetail = (errorJson as { detail: string }).detail;
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(errorDetail, res.status, errorJson);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Unwraps common FastAPI envelope shapes ({items: []}, {patients: []}, or plain array). */
function asList<T>(value: unknown, ...keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    for (const key of [...keys, "items", "data", "results"]) {
      const inner = (value as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner as T[];
    }
  }
  return [];
}

export const api = {
  health: () => request<unknown>("/"),

  listPatients: async (): Promise<Patient[]> =>
    asList<Patient>(await request<unknown>("/api/patients"), "patients"),

  createPatient: (input: PatientCreate) =>
    request<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getPatient: (patientId: string) =>
    request<Patient>(`/api/patients/${encodeURIComponent(patientId)}`),

  getHistory: async (patientId: string): Promise<Examination[]> =>
    asList<Examination>(
      await request<unknown>(`/api/patients/${encodeURIComponent(patientId)}/history`),
      "history",
      "examinations",
    ),

  getComparison: (patientId: string) =>
    request<Comparison>(`/api/patients/${encodeURIComponent(patientId)}/comparison`),

  analyze: (input: AnalyzeInput) =>
    request<AnalysisResult>("/api/examinations/analyze", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export const queries = {
  health: () => ({
    queryKey: ["health"] as const,
    queryFn: api.health,
    retry: 1,
    refetchInterval: 30_000,
    staleTime: 15_000,
  }),
  patients: () => ({
    queryKey: ["patients"] as const,
    queryFn: api.listPatients,
    retry: 1,
    staleTime: 30_000,
  }),
  patient: (id: string) => ({
    queryKey: ["patient", id] as const,
    queryFn: () => api.getPatient(id),
    retry: 1,
    staleTime: 30_000,
  }),
  history: (id: string) => ({
    queryKey: ["history", id] as const,
    queryFn: () => api.getHistory(id),
    retry: 1,
    staleTime: 30_000,
  }),
  comparison: (id: string) => ({
    queryKey: ["comparison", id] as const,
    queryFn: () => api.getComparison(id),
    retry: 1,
    staleTime: 30_000,
  }),
};
