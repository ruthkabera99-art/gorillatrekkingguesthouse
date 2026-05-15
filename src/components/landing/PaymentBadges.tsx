import { ShieldCheck, BadgeCheck, Zap } from "lucide-react";

const PaymentBadges = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div className={`flex flex-col items-center gap-3 ${compact ? "" : "py-4"}`}>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {[
          { Icon: ShieldCheck, label: "Free Cancellation" },
          { Icon: BadgeCheck, label: "Best Price Guarantee" },
          { Icon: Zap, label: "Instant Confirmation" },
        ].map(({ Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-sans font-semibold"
          >
            <Icon size={12} />
            {label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 opacity-80">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">
          Secure payment
        </span>
        {/* Visa */}
        <svg viewBox="0 0 48 16" className="h-5 w-auto" aria-label="Visa">
          <text x="0" y="13" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="14" fill="#1A1F71">
            VISA
          </text>
        </svg>
        {/* Mastercard */}
        <svg viewBox="0 0 32 20" className="h-5 w-auto" aria-label="Mastercard">
          <circle cx="12" cy="10" r="8" fill="#EB001B" />
          <circle cx="20" cy="10" r="8" fill="#F79E1B" opacity="0.85" />
        </svg>
        {/* PayPal */}
        <svg viewBox="0 0 60 16" className="h-5 w-auto" aria-label="PayPal">
          <text x="0" y="13" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="13" fill="#003087">
            Pay
          </text>
          <text x="22" y="13" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="13" fill="#009CDE">
            Pal
          </text>
        </svg>
      </div>
    </div>
  );
};

export default PaymentBadges;
