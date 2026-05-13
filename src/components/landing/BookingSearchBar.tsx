import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "hero" | "compact";
}

const BookingSearchBar = ({ variant = "hero" }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  const [checkIn, setCheckIn] = useState<Date | undefined>(today);
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("from", format(checkIn, "yyyy-MM-dd"));
    if (checkOut) params.set("to", format(checkOut, "yyyy-MM-dd"));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    navigate(`/rooms?${params.toString()}`);
  };

  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "w-full max-w-5xl mx-auto",
        isHero
          ? "bg-card/95 backdrop-blur-xl border-2 border-booking-yellow rounded-2xl shadow-2xl p-2 sm:p-2"
          : "bg-card border border-border rounded-xl shadow-md p-2"
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.4fr_auto] gap-2">
        {/* Check-in */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-background hover:bg-muted/50 border border-border text-left transition-colors min-h-[56px]"
              aria-label={t("search.checkIn")}
            >
              <CalendarIcon size={18} className="text-booking-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-semibold">
                  {t("search.checkIn")}
                </div>
                <div className="text-sm font-sans font-semibold text-foreground truncate">
                  {checkIn ? format(checkIn, "EEE, MMM d") : t("search.addDate")}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60]" align="start">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={(d) => {
                setCheckIn(d);
                if (d && checkOut && d >= checkOut) {
                  setCheckOut(new Date(d.getTime() + 86400000));
                }
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Check-out */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-background hover:bg-muted/50 border border-border text-left transition-colors min-h-[56px]"
              aria-label={t("search.checkOut")}
            >
              <CalendarIcon size={18} className="text-booking-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-semibold">
                  {t("search.checkOut")}
                </div>
                <div className="text-sm font-sans font-semibold text-foreground truncate">
                  {checkOut ? format(checkOut, "EEE, MMM d") : t("search.addDate")}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60]" align="start">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                (checkIn ? date <= checkIn : false)
              }
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Guests & rooms */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-background hover:bg-muted/50 border border-border text-left transition-colors min-h-[56px]"
              aria-label={t("search.guests")}
            >
              <Users size={18} className="text-booking-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-semibold">
                  {t("search.guests")} · {t("search.rooms")}
                </div>
                <div className="text-sm font-sans font-semibold text-foreground truncate">
                  {adults + children} {adults + children === 1 ? t("search.guest") : t("search.guestsPlural")} · {rooms} {rooms === 1 ? t("search.roomLabel") : t("search.roomsPlural")}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 z-[60]" align="end">
            <div className="space-y-4">
              {[
                { label: t("search.adults"), value: adults, set: setAdults, min: 1 },
                { label: t("search.children"), value: children, set: setChildren, min: 0 },
                { label: t("search.rooms"), value: rooms, set: setRooms, min: 1 },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="font-sans font-medium text-sm">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => row.set(Math.max(row.min, row.value - 1))}
                      disabled={row.value <= row.min}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center font-sans font-semibold">{row.value}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => row.set(row.value + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Search button */}
        <Button
          onClick={onSearch}
          className="bg-booking-blue text-booking-blue-foreground hover:bg-booking-blue/90 font-sans font-bold text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl min-h-[56px] gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Search size={20} />
          <span className="hidden sm:inline">{t("search.search")}</span>
          <span className="sm:hidden">{t("search.search")}</span>
        </Button>
      </div>
    </div>
  );
};

export default BookingSearchBar;
