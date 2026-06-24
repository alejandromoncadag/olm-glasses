export type Location = {
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  phone: string;
  email: string;
  hours: { day: string; time: string }[];
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
    address: "Av. Presidente Masaryk 123, Polanco IV Sección",
    phone: "55 1234 5678",
    email: "polanco@opticaolm.mx",
    hours: [
      { day: "Lunes – Viernes", time: "10:00 – 20:00" },
      { day: "Sábado", time: "11:00 – 19:00" },
      { day: "Domingo", time: "12:00 – 18:00" },
    ],
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
];

export function getLocationBySlug(slug: string) {
  return locations.find((location) => location.slug === slug);
}
