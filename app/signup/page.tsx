import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Crear cuenta · Óptica OLM",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-16 text-black">
      <AuthForm mode="signup" />
    </main>
  );
}
