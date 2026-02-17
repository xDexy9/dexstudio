import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "I'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-border">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">
            Get In Touch
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Let's Build Something Great
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Have a project in mind? I'd love to hear about it. Drop me a message and I'll get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Name
                </label>
                <Input
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-card border-border focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-card border-border focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Message
              </label>
              <Textarea
                placeholder="Tell me about your project..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="bg-card border-border focus:border-primary resize-none"
              />
            </div>
            <Button variant="hero" size="lg" type="submit" className="w-full sm:w-auto">
              Send Message <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <Mail className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Email</h3>
              <a
                href="mailto:hello@devstudio.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                hello@devstudio.com
              </a>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Calendar className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Book a Call</h3>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Schedule a 30-min discovery call →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
