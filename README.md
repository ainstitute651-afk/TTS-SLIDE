# SlideCast Studio 🎬🎙️

> Transform slides, ideas, and scripts into studio-grade narrated video presentations with Microsoft Edge Neural TTS voices, multi-voice dialogue, cinematic Ken Burns motion, background music with auto-ducking, and animated karaoke captions.

---

## 🚀 Deploying to GitHub Pages

This project is configured out-of-the-box for **GitHub Pages** deployment with relative asset paths and an automated GitHub Actions workflow.

### Option 1: Automatic Deployment with GitHub Actions (Recommended)

1. Push or export this repository to GitHub (e.g. via Google AI Studio's **Settings > Export to GitHub** or `git push origin main`).
2. Go to your repository on GitHub.
3. Navigate to **Settings** > **Pages** (in the left sidebar).
4. Under **Build and deployment** > **Source**, select **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` will automatically build the site and deploy it to `https://<username>.github.io/<repo-name>/` whenever changes are pushed to `main`.

### Option 2: Deploying via `gh-pages` Branch

If you prefer deploying a static branch directly:

```bash
# 1. Install dependencies
npm install

# 2. Build the static site
npm run build:pages

# 3. Deploy the dist folder to the gh-pages branch
npx gh-pages -d dist
```

Then in **Settings** > **Pages**, set **Source** to **Deploy from a branch** and select `gh-pages` / `(root)`.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run the development server (with Node.js backend & Edge Neural TTS proxy)
npm run dev

# Open your browser at
http://localhost:3000
```

---

## 📦 Scripts

- `npm run dev`: Boots the full-stack dev server on port 3000 with live TTS proxy.
- `npm run build`: Builds the static frontend to `dist/` and packages the standalone server bundle.
- `npm run build:pages`: Builds purely static assets to `dist/` optimized for GitHub Pages.
- `npm run start`: Runs the compiled production server.
- `npm run lint`: Checks TypeScript types.

---

## ✨ Features

- **Rich Slide Editor**: Shapes, text, cards, charts, icons, images, and master slide templates.
- **Neural Text-to-Speech**: High-fidelity Microsoft Edge neural voices with audition previews.
- **Multi-Voice Dialogue**: Syntax detection for `[Host 1]:` and `[Host 2]:` co-hosted presentations.
- **Cinematic Pan & Zoom**: Customizable Ken Burns camera drift and zoom.
- **Royalty-Free Audio**: Procedural background music with auto-ducking during voiceover.
- **Dynamic Captions**: Word-by-word karaoke highlights and downloadable .SRT/.VTT files.
- **Multi-Aspect Ratio**: 16:9 widescreen, 9:16 vertical (Shorts/Reels), and 1:1 square video export.
