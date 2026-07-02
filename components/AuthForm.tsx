"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";

type AuthFormProps = {
  mode: "login" | "signup";
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [redirectPath, setRedirectPath] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect) {
      setRedirectPath(redirect);
    }
  }, []);

  const baseSwitchHref = isLogin ? "/signup" : "/login";

  const switchHref = redirectPath
    ? `${baseSwitchHref}?redirect=${encodeURIComponent(redirectPath)}`
    : baseSwitchHref;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      if (isLogin) {
        await login(email, password);
      } else {
        await signup({
          fullName,
          email,
          password,
        });
      }

      router.push(redirectPath || "/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md">
      <h1 className="text-4xl font-bold">
        {isLogin ? "Iniciar sesión" : "Crear cuenta"}
      </h1>

      <p className="mt-4 text-gray-600">
        {isLogin
          ? "Entra a tu cuenta para continuar."
          : "Crea una cuenta para guardar tus pedidos y favoritos."}
      </p>

      <div className="mt-8 space-y-5">
        {!isLogin && (
          <label className="block">
            <span className="text-sm font-medium">Nombre completo</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Alejandro Moncada"
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="tu@email.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Tu contraseña"
          />
        </label>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full rounded-full bg-black px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isSubmitting
          ? isLogin
            ? "Entrando..."
            : "Creando cuenta..."
          : isLogin
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        {isLogin ? (
          <>
            ¿Aún no tienes cuenta?{" "}
            <a href={switchHref} className="font-medium text-black underline">
              Regístrate
            </a>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <a href={switchHref} className="font-medium text-black underline">
              Inicia sesión
            </a>
          </>
        )}
      </p>
    </form>
  );
}

