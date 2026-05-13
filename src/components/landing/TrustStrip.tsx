import { useTranslation } from "react-i18next";
import { Star, ShieldCheck, BadgeCheck, Wallet, Zap, Award } from "lucide-react";

const TrustStrip = () => {
  const { t } = useTranslation();
  const items = [
    { icon: Star, label: `9.4 · ${t("trust.rating")}`, color: "text-booking-yellow fill-booking-yellow" },
    { icon: ShieldCheck, label: t("trust.freeCancel") },
    { icon: BadgeCheck, label: t("trust.bestPrice") },
    { icon: Wallet, label: t("trust.payAtProperty") },
    { icon: Zap, label: t("trust.instantConfirm") },
    { icon: Award, label: t("trust.verifiedHost") },
  ];

  return (
    <section className="bg-card border-y border-border" aria-label="Trust signals">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-start sm:justify-center gap-x-6 gap-y-3 flex-wrap overflow-x-auto">
          {items.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-sans font-medium text-foreground/80 whitespace-nowrap">
              <Icon size={16} className={color || "text-booking-green"} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
