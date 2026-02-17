import { Button } from "@/components/ui/button";
import { ArrowRight, Palette } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          <span>DevStudio</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Work
          </a>
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Process
          </a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>
        <Button variant="hero" size="sm" asChild>
          <a href="#contact">
            Let's Talk <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
};

export default Header;
