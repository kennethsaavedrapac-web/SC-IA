export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  status: "Disponible" | "No disponible";
  distance: string;
  photoUrl: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: string;
  status: "Disponible" | "Poco stock" | "Agotado";
  openNow: boolean;
  closingTime?: string;
  medsAvailable: string[];
}

export interface HealthCenter {
  id: string;
  name: string;
  type: string;
  schedule: string;
  distance: string;
  durationMin: number;
  lat: number; // percentage of map container Y (0 - 100) for custom interactive map
  lng: number; // percentage of map container X (0 - 100)
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
