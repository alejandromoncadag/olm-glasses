import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Iniciar sesión · Óptica OLM",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-16 text-black">
      <AuthForm mode="login" />
    </main>
  );
}
