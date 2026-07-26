export type HelpFaq = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  href?: string;
  linkLabel?: string;
};

export const helpFaqs: HelpFaq[] = [
  {
    id: "agendar-examen",
    title: "Agendar examen de la vista",
    keywords: ["cita", "examen", "agendar", "optometrista", "vista"],
    answer:
      "Puedes elegir paciente, tienda, fecha y horario desde nuestra agenda. Cada cita dura aproximadamente 45 minutos.",
    href: "/eye-exam",
    linkLabel: "Agendar examen",
  },
  {
    id: "cambiar-cita",
    title: "Cancelar o reagendar cita",
    keywords: ["cancelar cita", "reagendar", "cambiar cita", "cancelacion"],
    answer:
      "Abre el enlace de administración incluido en la confirmación de tu cita para cancelarla o elegir una nueva fecha.",
    href: "/eye-exam",
    linkLabel: "Ver mis opciones",
  },
  {
    id: "tiendas",
    title: "Ver tiendas / sucursales",
    keywords: ["tienda", "tiendas", "sucursal", "sucursales", "ubicacion"],
    answer:
      "Tenemos ubicaciones en Cuautitlán, Estado de México, y Playa del Carmen, Quintana Roo. Consulta horarios, servicios y mapas.",
    href: "/locations",
    linkLabel: "Ver tiendas",
  },
  {
    id: "cuautitlan",
    title: "Cuautitlán",
    keywords: ["cuautitlan", "edomex", "estado de mexico", "santa maria"],
    answer:
      "Óptica OLM Cuautitlán está en Alfonso Reyes 96, Paseos de Sta Maria, Cuautitlán, Estado de México, C.P. 54800.",
    href: "/locations/cuautitlan-edomex",
    linkLabel: "Ver Cuautitlán",
  },
  {
    id: "playa",
    title: "Playa del Carmen",
    keywords: ["playa", "playa del carmen", "quintana roo", "riviera maya"],
    answer:
      "Óptica OLM Playa del Carmen está en Av. 28 de Julio esquina-115, Playa del Carmen, Quintana Roo, C.P. 77725.",
    href: "/locations/playa-del-carmen",
    linkLabel: "Ver Playa del Carmen",
  },
  {
    id: "pedido",
    title: "Rastrear pedido",
    keywords: ["pedido", "rastrear", "seguimiento", "orden", "envio"],
    answer:
      "Consulta el estado con tu número de pedido y el correo utilizado en la compra.",
    href: "/order-status",
    linkLabel: "Rastrear pedido",
  },
  {
    id: "factura",
    title: "Solicitar factura",
    keywords: ["factura", "facturacion", "rfc", "cfdi", "sat"],
    answer:
      "Puedes solicitar una factura para un pedido pagado. Primero validaremos el número de pedido y correo; después podrás proporcionar tus datos fiscales.",
    href: "/facturacion",
    linkLabel: "Solicitar factura",
  },
  {
    id: "opticos",
    title: "Comprar lentes ópticos",
    keywords: ["opticos", "graduados", "graduacion", "armazon", "micas"],
    answer:
      "Explora nuestros armazones ópticos, elige un modelo y después selecciona el tipo de lente que necesitas.",
    href: "/eyeglasses",
    linkLabel: "Ver lentes ópticos",
  },
  {
    id: "sol",
    title: "Comprar lentes de sol",
    keywords: ["sol", "solares", "proteccion uv", "sunglasses"],
    answer:
      "Nuestra colección de sol incluye modelos para uso diario y opciones deportivas.",
    href: "/sunglasses",
    linkLabel: "Ver lentes de sol",
  },
  {
    id: "contactos",
    title: "Lentes de contacto",
    keywords: ["contacto", "contactos", "lentillas", "caja"],
    answer:
      "Consulta las opciones de lentes de contacto disponibles. Verifica siempre tu graduación y adaptación con un profesional.",
    href: "/lentes-de-contacto",
    linkLabel: "Ver contactos",
  },
  {
    id: "accesorios",
    title: "Accesorios",
    keywords: ["accesorio", "accesorios", "estuche", "spray", "pano", "taza"],
    answer:
      "Tenemos accesorios para cuidar y acompañar tus lentes, como estuches, spray con paño y artículos OLM.",
    href: "/accessories",
    linkLabel: "Ver accesorios",
  },
  {
    id: "entrega",
    title: "Envío vs recoger en tienda",
    keywords: ["recoger", "recoleccion", "entrega", "domicilio", "envio tienda"],
    answer:
      "Durante la compra podrás elegir entre envío disponible o recoger en una tienda OLM, según el producto y la ubicación.",
    href: "/locations",
    linkLabel: "Ver tiendas",
  },
  {
    id: "pago",
    title: "Métodos de pago",
    keywords: ["pago", "pagos", "tarjeta", "visa", "mastercard", "stripe"],
    answer:
      "Los métodos disponibles se muestran de forma segura durante el checkout. Nunca compartas datos completos de tu tarjeta por chat.",
    href: "/cart",
    linkLabel: "Ir al carrito",
  },
  {
    id: "whatsapp",
    title: "Contactar por WhatsApp",
    keywords: ["whatsapp", "mensaje", "contactar", "telefono", "hablar"],
    answer:
      "Puedes escribir directamente a una tienda OLM por WhatsApp. Elige la ubicación que te quede mejor.",
  },
];

export const helpFallback =
  "Puedo ayudarte con citas, tiendas, pedidos, facturación, lentes ópticos, lentes de sol, lentes de contacto y accesorios. También puedes usar los botones rápidos.";

export const urgentEyeResponse =
  "Para síntomas urgentes o molestias importantes, te recomendamos contactar directamente a un profesional de la salud visual o acudir a una clínica cercana.";
