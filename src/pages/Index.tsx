import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import Experience from "@/components/landing/Experience";
import RoomShowcase from "@/components/landing/RoomShowcase";
import WhyBookDirect from "@/components/landing/WhyBookDirect";
import Amenities from "@/components/landing/Amenities";
import Gallery from "@/components/landing/Gallery";
import LocationSection from "@/components/landing/LocationSection";
import TrekkingTours from "@/components/landing/TrekkingTours";
import ReviewScoreCard from "@/components/landing/ReviewScoreCard";
import Testimonials from "@/components/landing/Testimonials";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

const SITE_URL = "https://gorillatrekkingguesthouse.lovable.app";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Helmet>
        <title>Gorilla Trekking Guest House — Musanze | Book Direct</title>
        <meta
          name="description"
          content="Boutique guest house near Volcanoes National Park, Musanze. Rooms from RWF 45,000, restaurant, bar & gorilla trekking tours. Book direct."
        />
        <meta name="keywords" content="gorilla trekking, Musanze hotel, Volcanoes National Park accommodation, Rwanda guest house, Kinigi lodge, Virunga lodging, Rwanda safari hotel" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/`} />
        <link rel="alternate" hrefLang="fr" href={`${SITE_URL}/?lang=fr`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />

        <meta property="og:title" content="Gorilla Trekking Guest House — Volcanoes NP, Rwanda" />
        <meta property="og:description" content="Authentic Rwandan hospitality minutes from Volcanoes National Park. Book your gorilla trekking stay direct." />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How far is the guest house from Volcanoes National Park?",
              acceptedAnswer: { "@type": "Answer", text: "Roughly a 15-minute drive — we organise gorilla trekking pickups every morning." },
            },
            {
              "@type": "Question",
              name: "Do you arrange airport transfers from Kigali?",
              acceptedAnswer: { "@type": "Answer", text: "Yes — Kigali International Airport is about 2.5 hours away. We organise private transfers on request." },
            },
            {
              "@type": "Question",
              name: "What is your cancellation policy?",
              acceptedAnswer: { "@type": "Answer", text: "Free cancellation up to 48 hours before check-in for direct bookings." },
            },
          ],
        })}</script>
      </Helmet>

      <Navbar />
      <Hero />
      <TrustStrip />
      <Experience />
      <RoomShowcase />
      <WhyBookDirect />
      <Amenities />
      <Gallery />
      <LocationSection />
      <TrekkingTours />
      <ReviewScoreCard />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
