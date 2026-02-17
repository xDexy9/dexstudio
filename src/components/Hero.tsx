import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(220_14%_10%/0.5)_1px,transparent_1px),linear-gradient(90deg,hsl(220_14%_10%/0.5)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Available for new projects
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight animate-fade-up animate-fade-up-delay-1">
          I Design & Build{" "}
          <span className="text-gradient">Web Apps That People Love</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up animate-fade-up-delay-2">
          Developer + designer who crafts pixel-perfect, high-performance web applications — where beautiful interfaces meet bulletproof engineering.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-fade-up-delay-3">
          <Button variant="hero" size="lg" asChild>
            <a href="#projects">
              View My Work <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <a href="#contact">Let's Work Together</a>
          </Button>
        </div>

        <div className="mt-20 animate-fade-up animate-fade-up-delay-4">
          <a href="#projects" className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
