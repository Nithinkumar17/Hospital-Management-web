import type { Doctor, DoctorInput, Patient, PatientInput } from "./types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Could not reach the hospital API at ${API_BASE_URL}. Check that it is running.`,
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      details?: string[];
    } | null;
    const message = [payload?.error, ...(payload?.details ?? [])]
      .filter(Boolean)
      .join(": ");
    throw new Error(
      message || `Hospital API request failed (${response.status}).`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const patientService = {
  getPatients: () => request<Patient[]>("/patients"),
  addPatient: (input: PatientInput) =>
    request<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updatePatient: (item: Patient) =>
    request<Patient>(`/patients/${item.id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  deletePatient: (id: number) =>
    request<void>(`/patients/${id}`, { method: "DELETE" }),
};

export const doctorService = {
  getDoctors: () => request<Doctor[]>("/doctors"),
  addDoctor: (input: DoctorInput) =>
    request<Doctor>("/doctors", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateDoctor: (item: Doctor) =>
    request<Doctor>(`/doctors/${item.id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  deleteDoctor: (id: number) =>
    request<void>(`/doctors/${id}`, { method: "DELETE" }),
};
