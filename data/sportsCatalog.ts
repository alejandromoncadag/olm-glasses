export type SportsActivity = "tenis" | "esqui" | "ciclismo";
export type SportsLensUse = "opticos" | "sol";

export type SportsProductDetails = {
  slug: string;
  activity: SportsActivity;
  activityLabel: string;
  lensUse: SportsLensUse;
  lensUseLabel: string;
  materialLabel: string;
  performanceNote: string;
};

export const sportsProductDetails: SportsProductDetails[] = [
  {
    slug: "court-air",
    activity: "tenis",
    activityLabel: "Tenis y pádel",
    lensUse: "opticos",
    lensUseLabel: "Deportivos ópticos",
    materialLabel: "Nylon TR90",
    performanceNote:
      "Ligero, estable y preparado para movimientos rápidos en la cancha.",
  },
  {
    slug: "alpine-shield",
    activity: "esqui",
    activityLabel: "Esquí y montaña",
    lensUse: "sol",
    lensUseLabel: "Deportivos de sol",
    materialLabel: "Titanio + nylon",
    performanceNote:
      "Cobertura amplia para ayudar a proteger del viento y la luz intensa.",
  },
  {
    slug: "velocity-one",
    activity: "ciclismo",
    activityLabel: "Ciclismo y running",
    lensUse: "sol",
    lensUseLabel: "Deportivos de sol",
    materialLabel: "ReForm",
    performanceNote:
      "Diseño aerodinámico con agarre cómodo para entrenamientos al aire libre.",
  },
];

export function getSportsProductDetails(slug: string) {
  return sportsProductDetails.find((product) => product.slug === slug);
}
