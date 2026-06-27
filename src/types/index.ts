
export interface HealthCenter {
  id: string;
  name: string;
  type: string;
  schedule: string;
  distance: string;
  durationMin: number;
  lat: number; 
  lng: number; 
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  department?: string;
  municipality?: string;
  locality?: string;
  zone?: string;
  phone?: string;
  silais?: string;
  sourceNumber?: number;
  hasCoordinates?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: "Confirmada" | "Pendiente" | "Completada";
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  city: string;
  country: string;
  avatarUrl: string;
  healthConditions: string[];
  emergencyPhone?: string;
  bloodType?: string;
}
