import { UserProfile, Appointment } from "../types";
export { HEALTH_CENTERS } from "./healthUnits";

export const DEFAULT_USER: UserProfile = {
  name: "Kenneth",
  email: "kenneth@gmail.com",
  city: "Granada",
  country: "Nicaragua",
  avatarUrl: "", // Empezar vacío
  healthConditions: ["Alergia al polen", "Presión arterial normal", "Tipo de sangre O+"]
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "app-1",
    doctorName: "Dra. Laura Martínez",
    specialty: "Cardiología",
    date: "2026-06-05",
    time: "10:30 AM",
    status: "Confirmada"
  },
  {
    id: "app-2",
    doctorName: "Dr. Carlos Gómez",
    specialty: "Dermatología",
    date: "2026-06-12",
    time: "3:15 PM",
    status: "Pendiente"
  }
];
