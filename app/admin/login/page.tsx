import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata = {
  title: "Acceso administrativo · Óptica OLM",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-16 text-black">
      <AdminLoginForm />
    </main>
  );
}
