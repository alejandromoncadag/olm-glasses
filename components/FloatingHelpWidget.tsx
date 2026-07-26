"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  helpFallback,
  helpFaqs,
  urgentEyeResponse,
  type HelpFaq,
} from "@/data/helpFaq";
import { locations } from "@/data/locations";
import { createWhatsAppLink } from "@/lib/whatsapp";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
  href?: string;
  linkLabel?: string;
};

const quickActions = [
  ["Agendar examen", "/eye-exam"],
  ["Ver tiendas", "/locations"],
  ["Rastrear pedido", "/order-status"],
  ["Solicitar factura", "/facturacion"],
  ["Lentes ópticos", "/eyeglasses"],
  ["Lentes de sol", "/sunglasses"],
] as const;

const urgentKeywords = [
  "dolor",
  "pain",
  "infeccion",
  "infection",
  "lesion",
  "injury",
  "golpe",
  "herida",
  "emergencia",
  "emergency",
  "urgencia",
  "rojez",
  "redness",
  "enrojecimiento",
  "perdida repentina",
  "sudden vision loss",
  "vision repentina",
  "no veo",
  "serious eye",
  "sintoma grave",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findAnswer(question: string): HelpFaq | null {
  const normalizedQuestion = normalize(question);
  let bestFaq: HelpFaq | null = null;
  let bestScore = 0;

  for (const faq of helpFaqs) {
    const score = faq.keywords.reduce(
      (total, keyword) =>
        total + (normalizedQuestion.includes(normalize(keyword)) ? normalize(keyword).length : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  return bestScore > 0 ? bestFaq : null;
}

export default function FloatingHelpWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "¡Hola! Soy la ayuda de Óptica OLM. Elige una opción o escribe tu pregunta.",
    },
  ]);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function addBotMessage(faq: HelpFaq | null, customText?: string) {
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + 1,
        sender: "bot",
        text: customText || faq?.answer || helpFallback,
        href: faq?.href,
        linkLabel: faq?.linkLabel,
      },
    ]);
  }

  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: "user", text: question },
    ]);
    setInput("");

    const normalizedQuestion = normalize(question);
    if (urgentKeywords.some((keyword) => normalizedQuestion.includes(keyword))) {
      addBotMessage(null, urgentEyeResponse);
      return;
    }
    addBotMessage(findAnswer(question));
  }

  function showQuickAnswer(label: string) {
    const faq =
      helpFaqs.find((item) => item.title.toLowerCase().includes(label.toLowerCase())) ||
      findAnswer(label);
    addBotMessage(faq);
  }

  function showWhatsAppOptions() {
    const available = locations.filter((location) => location.whatsapp);
    if (available.length === 0) {
      addBotMessage(null, "Información de contacto próximamente.");
      return;
    }
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: "bot",
        text: "Elige una tienda para escribir por WhatsApp:",
      },
    ]);
  }

  return (
    <>
      <section
        id="olm-help-panel"
        role="dialog"
        aria-label="Ayuda de Óptica OLM"
        aria-hidden={!open}
        className={`fixed bottom-24 left-3 right-3 z-50 flex max-h-[min(680px,72svh)] w-auto origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(45,31,26,0.24)] transition duration-300 sm:left-auto sm:right-6 sm:w-[390px] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between bg-[var(--brand-espresso)] px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
              Óptica OLM
            </p>
            <h2 className="mt-1 font-semibold">¿Cómo podemos ayudarte?</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
            aria-label="Cerrar ayuda"
          >
            <span aria-hidden className="text-xl">×</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#faf8f5] p-4">
          <div className="space-y-3" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.sender === "user"
                    ? "ml-auto bg-[var(--brand-espresso)] text-white"
                    : "border border-black/5 bg-white text-gray-700 shadow-sm"
                }`}
              >
                <p>{message.text}</p>
                {message.href && (
                  <a
                    href={message.href}
                    className="mt-2 inline-flex font-semibold text-[var(--brand-espresso)] underline underline-offset-4"
                  >
                    {message.linkLabel || "Ver más"}
                  </a>
                )}
              </div>
            ))}
            {messages.at(-1)?.text.includes("Elige una tienda") && (
              <div className="flex flex-wrap gap-2">
                {locations
                  .filter((location) => location.whatsapp)
                  .map((location) => (
                    <a
                      key={location.slug}
                      href={createWhatsAppLink(
                        `Hola, necesito ayuda con Óptica OLM ${location.neighborhood}.`,
                        location.whatsapp || undefined
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#2b7a4b] bg-white px-3 py-2 text-xs font-semibold text-[#23633d]"
                    >
                      {location.neighborhood}
                    </a>
                  ))}
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => showQuickAnswer(label)}
                className="shrink-0 rounded-full border border-black/15 bg-white px-3 py-2 text-xs font-semibold transition hover:border-[var(--brand-espresso)]"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={showWhatsAppOptions}
              className="shrink-0 rounded-full border border-black/15 bg-white px-3 py-2 text-xs font-semibold transition hover:border-[#2b7a4b]"
            >
              Contactar tienda
            </button>
          </div>
        </div>

        <form
          onSubmit={submitQuestion}
          className="flex gap-2 border-t border-black/10 bg-white p-3"
        >
          <label htmlFor="olm-help-question" className="sr-only">
            Escribe tu pregunta
          </label>
          <input
            id="olm-help-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu pregunta…"
            className="min-w-0 flex-1 rounded-full border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-espresso)]"
          />
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-espresso)] text-white transition hover:bg-black"
            aria-label="Enviar pregunta"
          >
            <span aria-hidden>↑</span>
          </button>
        </form>
      </section>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="olm-help-panel"
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
        className="fixed bottom-5 right-3 z-50 flex h-14 items-center gap-2 rounded-full bg-[var(--brand-espresso)] px-4 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(45,31,26,0.28)] transition hover:-translate-y-0.5 hover:bg-black sm:right-6"
      >
        <ChatIcon />
        <span>Ayuda</span>
      </button>
    </>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M5 18.5 3.8 21l3.7-1.2c1.3.7 2.8 1.1 4.5 1.1 5 0 9-3.8 9-8.5s-4-8.5-9-8.5-9 3.8-9 8.5c0 2.4 1 4.5 2 6.1Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" />
    </svg>
  );
}
