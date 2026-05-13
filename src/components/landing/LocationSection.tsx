import { useTranslation } from "react-i18next";
import { MapPin, Plane, Mountain, Building2, Waves } from "lucide-react";

const LocationSection = () => {
  const { t } = useTranslation();
  const places = [
    { icon: Mountain, name: t("location.vnp"), desc: t("location.vnpDesc") },
    { icon: Plane, name: t("location.airport"), desc: t("location.airportDesc") },
    { icon: Building2, name: t("location.town"), desc: t("location.townDesc") },
    { icon: Waves, name: t("location.lake"), desc: t("location.lakeDesc") },
  ];

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-booking-blue font-sans mb-3 flex items-center gap-2">
              <MapPin size={14} /> {t("hero.location")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-3">
              {t("location.title")}
            </h2>
            <p className="text-muted-foreground font-sans mb-8">{t("location.subtitle")}</p>

            <ul className="space-y-4">
              {places.map(({ icon: Icon, name, desc }) => (
                <li key={name} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-booking-blue/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-booking-blue" />
                  </div>
                  <div>
                    <div className="font-sans font-semibold text-foreground">{name}</div>
                    <div className="text-sm text-muted-foreground font-sans">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl overflow-hidden border border-border shadow-xl aspect-[4/3] bg-muted">
            <iframe
              title="Gorilla Trekking Guest House location"
              src="https://www.google.com/maps?q=Musanze,Rwanda&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
