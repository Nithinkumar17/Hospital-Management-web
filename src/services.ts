import type { Doctor, DoctorInput, Patient, PatientInput } from "./types";
import type { Appointment, DoctorSchedule } from "./AppointmentPages";

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
        ...(localStorage.getItem("hospital.authToken") ? { Authorization: `Bearer ${localStorage.getItem("hospital.authToken")}` } : {}),
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

export interface DashboardSummary { totalPatients:number; admittedPatients:number; dischargedPatients:number; totalDoctors:number; availableDoctors:number; departments:number; }
export const dashboardService = { get: () => request<DashboardSummary>("/dashboard") };

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

export type UserRole = "staff" | "doctor";
export interface AuthSession { token: string; user: { role: UserRole; email: string }; }
export const authService = {
  login: (role: UserRole, email: string, password: string) => request<AuthSession>("/auth/login", {
    method: "POST", body: JSON.stringify({ role, email, password }),
  }),
  setToken: (token: string | null) => token ? localStorage.setItem("hospital.authToken", token) : localStorage.removeItem("hospital.authToken"),
};
export const availabilityService = {
  setAvailable: (available: boolean) => request<Doctor>("/doctor-availability", { method: "PUT", body: JSON.stringify({ available }) }),
};

const toApiTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);
  if (!match) return value;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
};
const toDisplayTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};
const normalizeAppointment = (item: Appointment): Appointment => ({ ...item, appointmentTime: toDisplayTime(item.appointmentTime) });

export const appointmentService = {
  getAppointments: async () => (await request<Appointment[]>("/appointments")).map(normalizeAppointment),
  getAvailableDates: () => request<string[]>("/appointments/available-dates"),
  getAvailableSlots: async (date: string) => (await request<{ time: string; booked: boolean }[]>(`/appointments/slots?date=${encodeURIComponent(date)}`)).map(slot => ({ ...slot, time: toDisplayTime(slot.time) })),
  addAppointment: async (input: Omit<Appointment, "id" | "status">) => normalizeAppointment(await request<Appointment>("/appointments", {
    method: "POST", body: JSON.stringify({ ...input, bloodGroup: input.bloodGroup.replace("−", "-"), appointmentTime: toApiTime(input.appointmentTime) }),
  })),
  updateStatus: async (id: string, status: Appointment["status"]) => normalizeAppointment(await request<Appointment>(`/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH", body: JSON.stringify({ status }),
  })),
};

export const scheduleService = {
  get: () => request<DoctorSchedule>("/doctor-schedule"),
  save: (schedule: DoctorSchedule) => request<{ message: string; schedule: DoctorSchedule }>("/doctor-schedule", {
    method: "PUT", body: JSON.stringify(schedule),
  }).then(result => result.schedule),
};
