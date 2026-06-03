import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useHotelInfo } from "@/hooks/useHotelInfo";

const Contact = () => {
  const hotel = useHotelInfo();
  const contactInfo = [
    { icon: MapPin, label: "Location", text: hotel.address || "Musanze, Rwanda" },
    { icon: Phone, label: "Phone", text: hotel.phone || "+250 788 000 000" },
    { icon: Mail, label: "Email", text: hotel.email || "info@gorillatrekkingguesthouse.com" },
    { icon: Clock, label: "Front Desk", text: "24/7 Service Available" },
  ];
  return (
    <section id="contact" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Get In Touch
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Contact Us
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 sm:gap-12 max-w-6xl mx-auto">
          {/* Contact info side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={20} className="text-primary" />
                </div>
                <div className="pt-0.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-sm sm:text-base text-foreground/80 font-sans break-all sm:break-normal">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border mt-6">
              <iframe
                title="Hotel Location - Musanze, Rwanda"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.43!2d29.59!3d-1.50!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dc5a02bddbe9e3%3A0xae618e4a4f7d32a5!2sMusanze%2C+Rwanda!5e0!3m2!1sen!2s!4v1620000000000"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="sm:h-[220px]"
              />
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 space-y-5 bg-card rounded-2xl p-6 sm:p-10 shadow-luxury border border-border"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-sans font-medium text-card-foreground mb-2 block">
                  First Name
                </label>
                <Input placeholder="John" className="font-sans py-3 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-sans font-medium text-card-foreground mb-2 block">
                  Last Name
                </label>
                <Input placeholder="Doe" className="font-sans py-3 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-2 block">
                Email
              </label>
              <Input type="email" placeholder="john@example.com" className="font-sans py-3 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-2 block">
                Phone
              </label>
              <Input type="tel" placeholder="+250 788 000 000" className="font-sans py-3 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-2 block">
                Message
              </label>
              <Textarea placeholder="How can we assist you?" rows={4} className="font-sans rounded-xl" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-widest uppercase py-6 gap-2 shadow-luxury hover:shadow-2xl transition-all duration-300 active:scale-[0.98]">
              <Send size={16} />
              Send Message
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
