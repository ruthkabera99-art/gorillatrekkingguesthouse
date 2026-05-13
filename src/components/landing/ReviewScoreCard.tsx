import { useTranslation } from "react-i18next";

const ReviewScoreCard = () => {
  const { t } = useTranslation();
  const categories = [
    { key: "cleanliness", score: 9.6 },
    { key: "comfort", score: 9.4 },
    { key: "location", score: 9.7 },
    { key: "staff", score: 9.8 },
    { key: "value", score: 9.2 },
    { key: "facilities", score: 9.1 },
  ];

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-lg">
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-booking-blue text-booking-blue-foreground rounded-xl rounded-bl-none px-4 py-3 font-sans font-bold text-2xl sm:text-3xl">
                9.4
              </div>
              <div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                  {t("review.score")}
                </div>
                <div className="text-sm text-muted-foreground font-sans">
                  {t("review.based")} 248 {t("review.reviews")}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-sans sm:text-right">
              {t("review.rated")} 🇺🇸 🇬🇧 🇫🇷 🇩🇪 🇨🇦 🇦🇺 🇿🇦 +32
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {categories.map(({ key, score }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="font-sans text-sm text-foreground/80 w-32">
                  {t(`review.categories.${key}`)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-booking-blue rounded-full"
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
                <span className="font-sans text-sm font-bold text-foreground w-8 text-right">
                  {score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewScoreCard;
