# DexStudio Portfolio - Project Structure Guide

## Overview

This portfolio serves as the main hub showcasing all DexStudio projects/branches. Each project is presented as a separate route within the single-page application.

## Current Projects

- **GaragePRO** - Added and integrated
- *(More to be added)*

## How to Add a New Project

### Step 1: Create Project Route Structure

Create a new folder under `src/pages/projects/`:

```
src/pages/projects/
├── garagepro/
│   ├── index.tsx              # Main project page
│   ├── components/
│   │   ├── Overview.tsx
│   │   ├── Features.tsx
│   │   ├── Gallery.tsx
│   │   └── ...
│   └── data.ts                # Project metadata
└── yourproject/
    ├── index.tsx
    ├── components/
    └── data.ts
```

### Step 2: Create Project Component

**`src/pages/projects/yourproject/index.tsx`:**

```tsx
import { Navigation } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function YourProject() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-4">Your Project Name</h1>
          <p className="text-xl text-muted-foreground">Project description</p>
          {/* Add your project content */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

### Step 3: Add Route to App

**`src/App.tsx`:**

```tsx
import YourProject from "./pages/projects/yourproject";

// Inside Routes component:
<Route path="/projects/yourproject" element={<YourProject />} />
```

### Step 4: Add Navigation Link

Update `src/components/Projects.tsx` or `Header.tsx` to include a link to your new project:

```tsx
<NavLink href="/projects/yourproject" label="Your Project" />
```

### Step 5: (Optional) Create Project Data File

**`src/pages/projects/yourproject/data.ts`:**

```ts
export const projectData = {
  name: "Your Project Name",
  description: "Short description",
  icon: "🔧", // or import an icon
  tags: ["Tech1", "Tech2", "Tech3"],
  links: {
    demo: "https://demo-link.com",
    github: "https://github.com/xDexy9/project-repo",
    docs: "https://docs-link.com",
  },
  images: [
    "/images/yourproject/screenshot1.png",
    "/images/yourproject/screenshot2.png",
  ],
};
```

## Routing Structure

```
/                           → Main portfolio landing page
/projects/garagepro         → GaragePRO project
/projects/yourproject       → New project routes
/about                      → About page
/contact                    → Contact page
```

## Shared Components

All projects should use these shared components:
- `Header` / `Navigation` - For consistent navbar
- `Footer` - For consistent footer
- `ui/*` - shadcn/ui components via `@/components/ui/`

## Deployment Notes

After adding a new project:

1. **Local testing:**
   ```bash
   npm run dev
   # Test at http://localhost:8080/projects/yourproject
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Verify dist/ folder is created
   # Push to main branch for automatic GitHub Pages deployment
   ```

## Best Practices

✓ Use consistent styling with Tailwind CSS  
✓ Follow the existing component structure  
✓ Use TypeScript for type safety  
✓ Keep assets organized (`public/images/projectname/`)  
✓ Test responsive design on mobile  
✓ Update this document when adding new projects  
✓ Use proper metadata in project data files  

## Questions?

Refer to:
- `README.md` - Project overview
- `DEPLOY.md` - Deployment guide
- `src/components/` - Component examples
