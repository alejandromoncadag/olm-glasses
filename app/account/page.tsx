import AccountDashboard from "@/components/AccountDashboard";

export const metadata = {
  title: "Mi cuenta · Óptica OLM",
};

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-16 text-black">
      <AccountDashboard />
    </main>
  );
}
