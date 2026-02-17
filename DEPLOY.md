# GitHub Pages Deployment Guide

## Setup Instructions

### 1. Configure GitHub Repository

1. Go to your repository settings: `https://github.com/xDexy9/dexstudio/settings`
2. Navigate to **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
   - This will automatically use the workflow defined in `.github/workflows/deploy.yml`

### 2. Custom Domain Setup (if applicable)

1. In Repository Settings → Pages
2. Under "Custom domain", enter your domain (e.g., `dexstudio.dev`)
3. Create a CNAME file in the `public/` directory:
   ```
   dexstudio.dev
   ```
4. Configure your domain registrar to point to GitHub Pages:
   - Add A records pointing to GitHub's IPs, OR
   - Add a CNAME record pointing to `xdexy9.github.io`

### 3. Deploy

The site will automatically build and deploy when you:
- Push to the `main` branch
- Create/update a pull request

Manual deployment:
```bash
npm run build
npm run deploy
```

## Project Structure for Multiple Branches

### Adding a New Project Branch

1. Create a new directory in `src/pages/projects/`:
   ```
   src/pages/projects/
   ├── garagepro/
   │   ├── index.tsx
   │   └── components/
   └── newproject/
       ├── index.tsx
       └── components/
   ```

2. Add route to `src/App.tsx`:
   ```tsx
   import GaragePRO from "./pages/projects/garagepro";
   
   <Route path="/projects/garagepro" element={<GaragePRO />} />
   ```

3. Add link in navigation/projects list

## Important Files

- **`vite.config.ts`**: Build configuration with GitHub Pages settings
- **`package.json`**: Scripts and deployment commands
- **`.github/workflows/deploy.yml`**: Automated CI/CD pipeline
- **`public/.nojekyll`**: Prevents Jekyll processing on GitHub Pages
- **`src/App.tsx`**: Main routing configuration

## Troubleshooting

### Site not updating
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Wait 5-10 minutes for GitHub Pages to propagate
- Check Actions tab in repository for build errors

### Custom domain not working
- Verify DNS settings are configured correctly
- Remove and re-add the custom domain in Settings
- Check CNAME file exists in `public/` directory

### Build fails
- Check the Actions tab for error logs
- Run `npm run build` locally to test
- Verify all dependencies are properly listed in `package.json`
