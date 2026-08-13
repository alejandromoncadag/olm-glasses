import VerifyEmailScreen from "@/components/VerifyEmailScreen";

export const metadata = { title: "Verificar correo · Óptica OLM" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <VerifyEmailScreen token={params.token || ""} />;
}
