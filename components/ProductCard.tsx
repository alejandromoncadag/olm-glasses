type ProductCardProps = {
  name: string;
  price: number;
  category: string;
  color: string;
  href: string;
  stock: number;
};

export default function ProductCard({
  name,
  price,
  category,
  color,
  href,
  stock,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;

  return (
    <a
      href={href}
      className="group block rounded-2xl border p-6 transition hover:shadow-lg"
    >
      <div
        className="relative flex h-48 items-center justify-center rounded-xl"
        style={{ backgroundColor: color }}
      >
        <span className="text-sm text-gray-500">Imagen del producto</span>

        {isOutOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Agotado
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">{category}</p>

      <h2 className="mt-1 text-xl font-semibold group-hover:underline">
        {name}
      </h2>

      <p className="mt-2 text-gray-700">
        ${price.toLocaleString("es-MX")} MXN
      </p>

      {!isOutOfStock && (
        <p className="mt-2 text-sm text-gray-500">{stock} disponibles</p>
      )}
    </a>
  );
}

