import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="mt-12 grid items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          slug={product.slug}
          name={product.name}
          price={product.price}
          category={product.category}
          color={product.color}
          href={`/product/${product.slug}`}
          stock={product.stock}
          description={product.description}
          gender={product.gender}
          shape={product.shape}
          frameColor={product.frameColor}
          imageUrl={product.mainImage?.imageUrl}
          imageAltText={product.mainImage?.altText}
        />
      ))}
    </div>
  );
}

