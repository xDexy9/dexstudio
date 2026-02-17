import { Search, Hammer, LineChart, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Discover",
    description: "Understand your business, goals, and technical requirements through focused discovery.",
  },
  {
    icon: Hammer,
    number: "02",
    title: "Build",
    description: "Rapid development with weekly demos. You see progress and provide feedback continuously.",
  },
  {
    icon: LineChart,
    number: "03",
    title: "Optimize",
    description: "Performance tuning, testing, and refinement to ensure everything runs smoothly at scale.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Scale",
    description: "Launch with confidence and ongoing support to grow your application alongside your business.",
  },
];

const Process = () => {
  return (
    <section id="process" className="py-24 md:py-32 border-t border-border">
      <div className="container max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">
            How I Work
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            From Idea to Launch
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            A proven process that delivers results on time and on budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-border z-0" />
              )}
              <div className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-300 relative z-10">
                <span className="text-xs font-mono text-primary mb-4 block">
                  {step.number}
                </span>
                <step.icon className="h-8 w-8 text-foreground mb-4 group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
