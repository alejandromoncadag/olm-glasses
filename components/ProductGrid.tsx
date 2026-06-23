import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          name={product.name}
          price={product.price}
          category={product.category}
          color={product.color}
          href={`/product/${product.slug}`}
          stock={product.stock}
        />
      ))}
    </div>
  );
}


