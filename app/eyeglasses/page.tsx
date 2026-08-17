import PublicProductCatalog from "@/components/PublicProductCatalog";

export default function EyeglassesPage() {
  return (
    <PublicProductCatalog
      type="eyeglasses"
      title="Lentes ópticos"
      description="Explora nuestra colección de armazones modernos para todos los días."
      filterLayout="sidebar"
      actionLabel="Agregar al carrito"
      showNewBadge
      heroImage="/images/home-hero-eyewear.png"
      heroImagePosition="center"
      visualVariant="optical"
    />
  );
}



