import PublicProductCatalog from "@/components/PublicProductCatalog";

export const metadata = {
  title: "Clip-on · Óptica OLM",
  description:
    "Armazones ópticos compatibles con clip-on solar en Óptica OLM.",
};

export default function ClipOnPage() {
  return (
    <PublicProductCatalog
      type="eyeglasses"
      title="Lentes con clip‑on"
      description="Un armazón óptico y una vista solar en segundos. Explora modelos diseñados para usar con clip-on."
      filterLayout="sidebar"
      actionLabel="Agregar al carrito"
      showNewBadge
      heroImage="/products/clip-ons/nomada.webp"
      heroImagePosition="70% center"
      restrictToClipOn
      showClipOnFilter={false}
    />
  );
}
