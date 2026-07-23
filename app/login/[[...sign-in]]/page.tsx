import CustomerAuthScreen from "@/components/CustomerAuthScreen";

export const metadata = {
  title: "Iniciar sesión · Óptica OLM",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-12 text-black">
      <CustomerAuthScreen mode="login" />
    </main>
  );
}
