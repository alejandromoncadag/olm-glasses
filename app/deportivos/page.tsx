import type { Metadata } from "next";
import SportsCatalog from "@/components/SportsCatalog";

export const metadata: Metadata = {
  title: "Lentes deportivos | Óptica OLM",
  description:
    "Lentes deportivos ópticos y de sol para tenis, esquí, ciclismo y running.",
};

export default function SportsPage() {
  return <SportsCatalog />;
}
