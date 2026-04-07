import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Experience from "@/components/landing/Experience";
import RoomShowcase from "@/components/landing/RoomShowcase";
import Amenities from "@/components/landing/Amenities";
import Testimonials from "@/components/landing/Testimonials";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Experience />
      <RoomShowcase />
      <Amenities />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
