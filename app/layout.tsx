import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import { isCustomerAuthConfigured } from "@/lib/customerAuthConfig";
import { LikesProvider } from "@/hooks/useLikes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Óptica OLM",
  description: "Compra lentes ópticos y de sol en México.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const customerAuthConfigured = isCustomerAuthConfigured();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider customerAuthConfigured={customerAuthConfigured}>
          <LikesProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </LikesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
