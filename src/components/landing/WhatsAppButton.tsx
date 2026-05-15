import { useState } from "react";

const WHATSAPP_NUMBER = "250788000000"; // placeholder
const HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello! I'd like to inquire about a stay at Gorilla Trekking Guest House."
)}`;

const WhatsAppButton = () => {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[55] flex items-center gap-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {hover && (
        <span className="hidden sm:inline-block px-3 py-2 rounded-lg bg-foreground text-background text-xs font-sans font-semibold shadow-lg whitespace-nowrap">
          Chat with us on WhatsApp
        </span>
      )}
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 ring-4 ring-white/20"
        style={{ background: "#25D366" }}
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" aria-hidden="true">
          <path d="M19.11 17.46c-.27-.14-1.62-.8-1.87-.89-.25-.09-.43-.14-.61.14-.18.27-.7.89-.86 1.07-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.36-1.62-1.52-1.89-.16-.27-.02-.42.12-.55.13-.13.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.84.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.12-.25-.18-.52-.32zM16.04 5.33c-5.91 0-10.71 4.79-10.71 10.69 0 1.88.49 3.71 1.42 5.33L5 27l5.81-1.52a10.7 10.7 0 0 0 5.22 1.34h.01c5.91 0 10.71-4.79 10.71-10.69 0-2.86-1.11-5.55-3.13-7.57a10.62 10.62 0 0 0-7.58-3.13zm0 19.6h-.01a8.86 8.86 0 0 1-4.52-1.24l-.32-.19-3.36.88.9-3.27-.21-.34a8.84 8.84 0 0 1-1.36-4.74c0-4.91 4-8.91 8.9-8.91 2.38 0 4.61.93 6.29 2.61a8.85 8.85 0 0 1 2.6 6.3c0 4.91-4 8.9-8.91 8.9z" />
        </svg>
      </span>
    </a>
  );
};

export default WhatsAppButton;
