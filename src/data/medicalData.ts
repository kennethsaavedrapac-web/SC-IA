import { Doctor, Pharmacy, HealthCenter, UserProfile, Appointment } from "../types";

export const DEFAULT_USER: UserProfile = {
  name: "Kenneth",
  email: "kenneth@gmail.com",
  city: "Granada",
  country: "Nicaragua",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256", // Stylish profile portrait
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

export const DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dra. Laura Martínez",
    specialty: "Cardiología",
    rating: 4.9,
    experience: 8,
    status: "Disponible",
    distance: "A 800 m",
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "doc-2",
    name: "Dr. Carlos Gómez",
    specialty: "Dermatología",
    rating: 4.8,
    experience: 6,
    status: "Disponible",
    distance: "A 1.2 km",
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "doc-3",
    name: "Dra. Ana Ruiz",
    specialty: "Pediatría",
    rating: 4.9,
    experience: 10,
    status: "Disponible",
    distance: "A 1.5 km",
    photoUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "doc-4",
    name: "Dra. Sofia Navarro",
    specialty: "Ginecología",
    rating: 4.7,
    experience: 12,
    status: "Disponible",
    distance: "A 2.1 km",
    photoUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "doc-5",
    name: "Dr. Mateo Torres",
    specialty: "Traumatología",
    rating: 4.6,
    experience: 5,
    status: "Disponible",
    distance: "A 3.0 km",
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "doc-6",
    name: "Dra. Valeria Castro",
    specialty: "Medicina General",
    rating: 4.9,
    experience: 14,
    status: "Disponible",
    distance: "A 900 m",
    photoUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200"
  }
];

export const PHARMACIES: Pharmacy[] = [
  {
    id: "pharm-1",
    name: "Farmacia Central",
    address: "Calle Recogidas, 28",
    distance: "A 450 m",
    status: "Disponible",
    openNow: true,
    medsAvailable: [
      "Paracetamol 500 mg",
      "Ibuprofeno 400 mg",
      "Loratadina 10 mg",
      "Amoxicilina 500 mg",
      "Omeprazol 20 mg",
      "Aspirina 100 mg",
      "Cetirizina 10 mg"
    ]
  },
  {
    id: "pharm-2",
    name: "Farmacia San Miguel",
    address: "Calle Pedro Antonio, 6",
    distance: "A 1.2 km",
    status: "Disponible",
    openNow: true,
    medsAvailable: [
      "Paracetamol 500 mg",
      "Ibuprofeno 400 mg",
      "Amoxicilina 500 mg",
      "Omeprazol 20 mg"
    ]
  },
  {
    id: "pharm-3",
    name: "Farmacia Gran Vía",
    address: "Gran Vía de Colón, 52",
    distance: "A 1.8 km",
    status: "Disponible",
    openNow: false,
    closingTime: "Cierra a las 21:00",
    medsAvailable: [
      "Paracetamol 500 mg",
      "Omeprazol 20 mg",
      "Aspirina 100 mg",
      "Metformina 850 mg"
    ]
  },
  {
    id: "pharm-4",
    name: "Farmacia Granada Sur",
    address: "Avenida de Cervantes, 14",
    distance: "A 2.5 km",
    status: "Poco stock",
    openNow: true,
    medsAvailable: [
      "Ibuprofeno 400 mg",
      "Salbutamol Inhalador",
      "Loratadina 10 mg"
    ]
  },
  {
    id: "pharm-5",
    name: "Farmacia de la Hípica",
    address: "Camino de Ronda, 105",
    distance: "A 3.1 km",
    status: "Agotado",
    openNow: true,
    medsAvailable: [
      "Cetirizina 10 mg",
      "Omeprazol 20 mg"
    ]
  }
];

export const HEALTH_CENTERS: HealthCenter[] = [
  {
    id: "hc-1",
    name: "Hospital Bautista",
    type: "Hospital general",
    schedule: "Abierto 24h",
    distance: "1.2 km",
    durationMin: 4,
    lat: 30, // Y coordinate % on customized visual map
    lng: 58  // X coordinate %
  },
  {
    id: "hc-2",
    name: "Centro de Salud Sócrates Flores",
    type: "Centro de salud",
    schedule: "Abierto · Cierra a las 8:00 p.m.",
    distance: "2.1 km",
    durationMin: 6,
    lat: 50,
    lng: 32
  },
  {
    id: "hc-3",
    name: "Hospital Amistad Japón Nicaragua",
    type: "Hospital especializado",
    schedule: "Abierto 24h",
    distance: "3.6 km",
    durationMin: 8,
    lat: 42,
    lng: 78
  },
  {
    id: "hc-4",
    name: "Clínica San Francisco",
    type: "Clínica privada",
    schedule: "Abierto · Cierra a las 6:00 p.m.",
    distance: "4.0 km",
    durationMin: 12,
    lat: 68,
    lng: 24
  },
  {
    id: "hc-5",
    name: "Centro de Salud Granada Sur",
    type: "Centro de salud",
    schedule: "Abierto 24h",
    distance: "4.5 km",
    durationMin: 10,
    lat: 82,
    lng: 52
  }
];
