import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Tag, ShieldCheck, Gift } from "lucide-react";

const WhyBookDirect = () => {
  const { t } = useTranslation();
  const perks = [
    { icon: Tag, title: t("whyDirect.perk1Title"), body: t("whyDirect.perk1Body") },
    { icon: ShieldCheck, title: t("whyDirect.perk2Title"), body: t("whyDirect.perk2Body") },
    { icon: Gift, title: t("whyDirect.perk3Title"), body: t("whyDirect.perk3Body") },
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-3">
            {t("whyDirect.title")}
          </h2>
          <p className="text-muted-foreground font-sans max-w-xl mx-auto">{t("whyDirect.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {perks.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 sm:p-7 hover:shadow-xl hover:border-booking-blue/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-booking-blue/10 flex items-center justify-center mb-4">
                <Icon size={22} className="text-booking-blue" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyBookDirect;
