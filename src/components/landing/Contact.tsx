import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Get In Touch
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
            Contact Us
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info + Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6 mb-8">
              {[
                { icon: MapPin, text: "Musanze, Rwanda — Near Volcanoes National Park" },
                { icon: Phone, text: "+250 788 000 000" },
                { icon: Mail, text: "info@gorillatrekkingguesthouse.com" },
                { icon: Clock, text: "24/7 Front Desk Service" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <p className="text-foreground/80 font-sans pt-2">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Map embed */}
            <div className="rounded-xl overflow-hidden shadow-lg border border-border">
              <iframe
                title="Hotel Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.0576!2d-118.4!3d34.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDA0JzEyLjAiTiAxMTjCsDI0JzAwLjAiVw!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5 bg-card rounded-xl p-8 shadow-luxury border border-border"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-sans font-medium text-card-foreground mb-1.5 block">
                  First Name
                </label>
                <Input placeholder="John" className="font-sans" />
              </div>
              <div>
                <label className="text-sm font-sans font-medium text-card-foreground mb-1.5 block">
                  Last Name
                </label>
                <Input placeholder="Doe" className="font-sans" />
              </div>
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-1.5 block">Email</label>
              <Input type="email" placeholder="john@example.com" className="font-sans" />
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-1.5 block">Phone</label>
              <Input type="tel" placeholder="+1 (555) 000-0000" className="font-sans" />
            </div>
            <div>
              <label className="text-sm font-sans font-medium text-card-foreground mb-1.5 block">Message</label>
              <Textarea placeholder="How can we assist you?" rows={4} className="font-sans" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide py-5">
              Send Message
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
