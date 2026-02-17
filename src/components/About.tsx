import { Code2, Brain, Zap, Palette } from "lucide-react";

const skills = [
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Modern interfaces with attention to detail, motion, and user experience that converts.",
  },
  {
    icon: Code2,
    title: "Full-Stack Development",
    description: "React, TypeScript, Node.js, and modern frameworks for scalable web applications.",
  },
  {
    icon: Brain,
    title: "AI Integrations",
    description: "OpenAI, LangChain, and custom ML pipelines embedded into production apps.",
  },
  {
    icon: Zap,
    title: "Systems & Automation",
    description: "Workflow automation, API integrations, and intelligent business process optimization.",
  },
];

const About = () => {
  return (
    <section id="about" className="py-24 md:py-32 border-t border-border">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">
              About
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Design-driven <span className="text-gradient">developer</span>
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                I sit at the intersection of design and engineering — equally obsessed with how things look and how they work under the hood.
              </p>
              <p>
                I believe the best products come from someone who understands both the user's eye and the system's architecture. Every interface I build is crafted with the same care as the code that powers it.
              </p>
              <p>
                From pixel-perfect UI to scalable backend systems, I ship products that are beautiful, fast, and built to last.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.title}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <skill.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">
                  {skill.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
