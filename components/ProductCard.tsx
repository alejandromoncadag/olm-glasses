type ProductCardProps = {
  name: string;
  price: number;
  category: string;
  color: string;
  href: string;
};

export default function ProductCard({
  name,
  price,
  category,
  color,
  href,
}: ProductCardProps) {
  return (
    <a href={href} className="group block rounded-2xl border p-6 transition hover:shadow-lg">
      <div
        className="flex h-48 items-center justify-center rounded-xl"
        style={{ backgroundColor: color }}
      >
        <span className="text-sm text-gray-500">Imagen del producto</span>
      </div>

      <p className="mt-4 text-sm text-gray-500">{category}</p>

      <h2 className="mt-1 text-xl font-semibold group-hover:underline">
        {name}
      </h2>

      <p className="mt-2 text-gray-700">
        ${price.toLocaleString("es-MX")} MXN
      </p>
    </a>
  );
}