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
  hours: { day: string; time: string }[];
  appointmentDurationMinutes: number;
  appointmentBufferMinutes: number;
  googleCalendarId: string | null;
  services: string[];
  description: string;
  color: string;
};

export const locations: Location[] = [
  {
    slug: "polanco",
    name: "Óptica OLM Polanco",
    neighborhood: "Polanco",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "11560",
    country: "México",
    timezone: "America/Mexico_City",
    address: "Av. Presidente Masaryk 123, Polanco IV Sección",
    phone: "55 1234 5678",
    whatsapp: null,
    email: "polanco@opticaolm.mx",
    hours: [
      { day: "Lunes – Viernes", time: "10:00 – 20:00" },
      { day: "Sábado", time: "11:00 – 19:00" },
      { day: "Domingo", time: "12:00 – 18:00" },
    ],
    appointmentDurationMinutes: 30,
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
      "Nuestra tienda insignia en el corazón de Polanco. Pasa a probarte cualquier modelo, agenda un examen de la vista o recoge tu pedido en persona.",
    color: "#f7f3ee",
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
    hours: [
      { day: "Lunes – Sábado", time: "10:00 – 20:00" },
      { day: "Domingo", time: "Cerrado" },
    ],
    appointmentDurationMinutes: 30,
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
  },
];

export function getLocationBySlug(slug: string) {
  return locations.find((location) => location.slug === slug);
}
