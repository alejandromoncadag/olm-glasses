import { ReactNode } from "react";
import AdminGuard from "@/components/AdminGuard";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="font-olm-admin">
      <AdminGuard>{children}</AdminGuard>
    </div>
  );
}

