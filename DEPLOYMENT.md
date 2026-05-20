# Soccer Studio - Deployment Guide

## Deploy to Vercel (Recommended)

Soccer Studio is ready for deployment to Vercel with the included `vercel.json` configuration.

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository: `ajith-appukuttan/soccer-studio`
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click "Deploy"

The app will be live at: `https://[project-name].vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# Set up and deploy? Yes
# Which scope? (select your account)
# Link to existing project? No
# Project name: soccer-studio
# Directory: ./
```

### Configuration Details

The `vercel.json` configuration:
- Builds the frontend from `packages/frontend`
- Serves the React SPA with proper routing
- No environment variables needed (client-side only)

## Deploy to Other Platforms

### Netlify
1. Build command: `cd packages/frontend && npm install && npm run build`
2. Publish directory: `packages/frontend/dist`
3. Redirects: `/* /index.html 200`

### GitHub Pages
```bash
cd packages/frontend
npm run build
# Upload dist/ folder to gh-pages branch
```

### Docker (Self-hosted)
```dockerfile
FROM nginx:alpine
COPY packages/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Features Available in Production

- ✅ Client-side video processing
- ✅ IndexedDB storage (no backend needed)
- ✅ Frame-by-frame navigation
- ✅ Drawing annotations
- ✅ Voice commentary recording
- ✅ Video export with annotations
- ✅ Project management

All features work entirely in the browser with no external dependencies.