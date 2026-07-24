import PublicProductCatalog from "@/components/PublicProductCatalog";

export default function SunglassesPage() {
  return (
    <PublicProductCatalog
      type="sunglasses"
      title="Lentes de sol"
      description="Explora nuestra colección de lentes de sol para todos los días."
      filterLayout="sidebar"
      actionLabel="Seleccionar modelo"
      showNewBadge
      heroImage="/images/sunglasses-collection-hero.png"
      heroImagePosition="center"
    />
  );
}




