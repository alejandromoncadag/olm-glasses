"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";

const appearance = {
  variables: {
    colorPrimary: "#4a2d23",
    colorText: "#1f1714",
    colorBackground: "#ffffff",
    borderRadius: "0.9rem",
  },
  elements: {
    cardBox: "shadow-none",
    card: "shadow-none border border-black/10",
    formButtonPrimary:
      "bg-[#4a2d23] hover:bg-[#2d1f1a] normal-case text-sm",
    socialButtonsBlockButton:
      "border-black/15 hover:border-[#4a2d23] hover:bg-[#f7f3ee]",
    footerActionLink: "text-[#4a2d23] hover:text-[#2d1f1a]",
  },
};

export default function CustomerAuthScreen({
  mode,
}: {
  mode: "login" | "signup";
}) {
  const { customerAuthConfigured } = useAuth();

  if (!customerAuthConfigured) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#d9cfc8] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
          Cuenta OLM
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          El acceso seguro está listo para configurarse
        </h1>
        <p className="mt-4 text-gray-600">
          Falta conectar las llaves de Clerk para activar Google y el código de
          verificación por correo. Ninguna contraseña se guardará en este
          navegador.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full border border-[#4a2d23] px-6 py-3 text-sm font-medium text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
        >
          Volver a la tienda
        </Link>
        <p className="mt-6 text-xs text-gray-500">
          El acceso administrativo permanece disponible por separado.
        </p>
        <Link
          href="/admin/login"
          className="mt-2 inline-block text-sm text-[#4a2d23] underline"
        >
          Acceso administrativo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-stretch">
      <section className="flex flex-1 flex-col justify-center rounded-3xl bg-[#4a2d23] p-8 text-white lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Óptica OLM
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight">
          Tu graduación, pedidos y favoritos en un mismo lugar.
        </h1>
        <ul className="mt-8 space-y-4 text-sm text-white/85">
          <li>• Consulta pedidos y pagos desde cualquier dispositivo.</li>
          <li>• Guarda direcciones y modelos favoritos.</li>
          <li>• Mantén tus citas y datos de contacto organizados.</li>
        </ul>
        <p className="mt-8 text-xs text-white/60">
          Inicio seguro con Google o código enviado a tu correo.
        </p>
      </section>

      <div className="flex min-h-[580px] flex-1 items-center justify-center rounded-3xl bg-white p-4 sm:p-8">
        {mode === "login" ? (
          <SignIn
            appearance={appearance}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/account"
            signUpFallbackRedirectUrl="/account"
          />
        ) : (
          <SignUp
            appearance={appearance}
            routing="path"
            path="/signup"
            signInUrl="/login"
            fallbackRedirectUrl="/account"
            signInFallbackRedirectUrl="/account"
          />
        )}
      </div>
    </div>
  );
}
