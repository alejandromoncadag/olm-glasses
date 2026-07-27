"use client";

export default function LiveChatButton() {
  function openLiveChat() {
    window.dispatchEvent(new CustomEvent("olm:open-help"));
  }

  return (
    <button
      type="button"
      onClick={openLiveChat}
      className="flex h-10 items-center gap-2 rounded-full border border-[var(--brand-espresso)] bg-[var(--brand-espresso)] px-4 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)]"
      aria-label="Abrir Live chat de Óptica OLM"
    >
      <ChatIcon />
      <span>Live chat</span>
    </button>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
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
