import { Button } from "@/components/ui/button";
import { ArrowUpRight, Github } from "lucide-react";
import projectFintrack from "@/assets/project-fintrack.jpg";
import projectFlowboard from "@/assets/project-flowboard.jpg";
import projectCms from "@/assets/project-cms.jpg";
import projectAutoscale from "@/assets/project-autoscale.jpg";

interface Project {
  name: string;
  description: string;
  techStack: string[];
  demoUrl: string;
  githubUrl?: string;
  image: string;
}

const projects: Project[] = [
  {
    name: "FinTrack Pro",
    description: "Real-time financial dashboard with AI-powered insights and automated reporting for SaaS companies.",
    techStack: ["React", "TypeScript", "Supabase", "OpenAI"],
    demoUrl: "#",
    githubUrl: "#",
    image: projectFintrack,
  },
  {
    name: "FlowBoard",
    description: "Kanban-style project management tool with real-time collaboration and workflow automation.",
    techStack: ["React", "Node.js", "PostgreSQL", "WebSockets"],
    demoUrl: "#",
    githubUrl: "#",
    image: projectFlowboard,
  },
  {
    name: "ShipFast CMS",
    description: "Headless CMS platform with drag-and-drop builder, multi-tenant support, and REST/GraphQL APIs.",
    techStack: ["Next.js", "Prisma", "Tailwind", "Stripe"],
    demoUrl: "#",
    image: projectCms,
  },
  {
    name: "AutoScale AI",
    description: "AI-powered customer support platform with smart routing, sentiment analysis, and response generation.",
    techStack: ["React", "Python", "LangChain", "Redis"],
    demoUrl: "#",
    githubUrl: "#",
    image: projectAutoscale,
  },
];

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <div className="group glow-card rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
      {/* Preview image */}
      <div className="relative overflow-hidden">
        <div className="aspect-[16/10] overflow-hidden bg-secondary">
          <img
            src={project.image}
            alt={`${project.name} preview`}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        {/* Fade overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="relative z-10 p-6 pt-2">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <div className="flex gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>

        <Button variant="heroOutline" size="sm" asChild className="w-full">
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
            Live Demo <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

const Projects = () => {
  return (
    <section id="projects" className="py-24 md:py-32">
      <div className="container max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">
            Selected Work
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Designed & Engineered
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Web applications where thoughtful design meets solid engineering — every pixel and every function with purpose.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
