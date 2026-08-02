import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "material-symbols/outlined.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import { isCustomerAuthConfigured } from "@/lib/customerAuthConfig";
import { LikesProvider } from "@/hooks/useLikes";
import FloatingHelpWidget from "@/components/FloatingHelpWidget";
import CartPersistence from "@/components/CartPersistence";
import TypographyRuntime from "@/components/TypographyRuntime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="font-olm-body min-h-full flex flex-col">
        <TypographyRuntime />
        <AuthProvider customerAuthConfigured={customerAuthConfigured}>
          <CartPersistence />
          <LikesProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
            <FloatingHelpWidget />
          </LikesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
