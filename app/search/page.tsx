import type { Metadata } from "next";
import SiteSearch from "@/components/SiteSearch";

export const metadata: Metadata = {
  title: "Buscar | Óptica OLM",
  description: "Busca productos, servicios y tiendas de Óptica OLM.",
};

export default function SearchPage() {
  return <SiteSearch />;
}
