import FulfillmentStatusList from "@/components/FulfillmentStatusList";

export default function ShippingStatusPage() {
  return <main className="min-h-screen bg-[#f7f4ee] px-6 py-12 text-stone-950"><section className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">OLM Glasses</p><h1 className="mt-2 text-4xl font-bold">Mis solicitudes de entrega</h1><p className="mt-4 max-w-2xl text-stone-600">Consulta cotizaciones manuales y opciones de sucursal protegidas por tu sesión. Esta pantalla no recupera solicitudes por correo o número.</p><FulfillmentStatusList /></section></main>;
}
