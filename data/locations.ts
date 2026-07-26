export type Location = {
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  address: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  mapsUrl: string;
  hours: { day: string; time: string }[];
  appointmentDurationMinutes: number;
  appointmentBufferMinutes: number;
  googleCalendarId: string | null;
  services: string[];
  description: string;
  color: string;
  image: string;
};

export const locations: Location[] = [
  {
    slug: "playa-del-carmen",
    name: "Óptica OLM Playa del Carmen",
    neighborhood: "Playa del Carmen",
    city: "Playa del Carmen",
    state: "Quintana Roo",
    zipCode: "77725",
    country: "México",
    timezone: "America/Cancun",
    address: "Av. 28 de Julio esquina-115",
    phone: "+52 984 177 6838",
    whatsapp: "+52 984 177 6838",
    email: "opticaplaya@gmail.com",
    mapsUrl: "https://maps.app.goo.gl/t9aWm2pDaKn5TUCWA",
    hours: [
      { day: "Lunes – Viernes", time: "10:00 – 20:00" },
      { day: "Sábado", time: "11:00 – 19:00" },
      { day: "Domingo", time: "12:00 – 18:00" },
    ],
    appointmentDurationMinutes: 45,
    appointmentBufferMinutes: 0,
    googleCalendarId: null,
    services: [
      "Examen de la vista con optometrista",
      "Pruebas de visión y ajuste de armazón",
      "Asesoría de estilo personalizada",
      "Reparación y ajuste de armazones",
      "Recoger pedidos en tienda",
    ],
    description:
      "Visítanos en Playa del Carmen para realizar tu examen de la vista, probarte armazones y recibir asesoría personalizada cerca del corazón de la Riviera Maya.",
    color: "#eee6d8",
    image: "/images/locations/playa-del-carmen-neighborhood.png",
  },
  {
    slug: "cuautitlan-edomex",
    name: "Óptica OLM Cuautitlán Edo Mex",
    neighborhood: "Paseos de Sta Maria",
    city: "Cuautitlán",
    state: "Estado de México",
    zipCode: "54800",
    country: "México",
    timezone: "America/Mexico_City",
    address: "Alfonso Reyes 96, Paseos de Sta Maria",
    phone: "+52 1 56 2086 8654",
    whatsapp: "+52 1 56 2086 8654",
    email: "recepcion@opticaolm.com.mx",
    mapsUrl: "https://maps.app.goo.gl/HGA4idkxvrCVZZJZA",
    hours: [
      { day: "Lunes – Sábado", time: "10:00 – 20:00" },
      { day: "Domingo", time: "Cerrado" },
    ],
    appointmentDurationMinutes: 45,
    appointmentBufferMinutes: 10,
    googleCalendarId: null,
    services: [
      "Examen de la vista con optometrista",
      "Pruebas de visión y ajuste de armazón",
      "Asesoría de estilo personalizada",
      "Reparación y ajuste de armazones",
      "Recoger pedidos en tienda",
    ],
    description:
      "Visítanos en Cuautitlán para realizar tu examen de la vista, probarte armazones y recibir asesoría personalizada.",
    color: "#f7f3ee",
    image: "/images/locations/cuautitlan-neighborhood.png",
  },
];

export function getLocationBySlug(slug: string) {
  return locations.find((location) => location.slug === slug);
}
