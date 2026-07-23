import CustomerAuthScreen from "@/components/CustomerAuthScreen";

export const metadata = {
  title: "Crear cuenta · Óptica OLM",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-12 text-black">
      <CustomerAuthScreen mode="signup" />
    </main>
  );
}
