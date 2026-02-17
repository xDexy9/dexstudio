import { Code2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-2 font-bold text-foreground">
          <Code2 className="h-4 w-4 text-primary" />
          <span>DevStudio</span>
        </a>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} DevStudio. Built with precision.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
