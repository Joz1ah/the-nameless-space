# the nameless space 🌸

A quiet, personal digital notebook. Write thoughts. Insert photos. Flip through pages.

---

## Stack
- React + Vite
- Supabase (Postgres + Storage)
- Vercel (deployment)

---

## Setup Guide

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Name it `the-nameless-space`
3. Go to **SQL Editor** → paste the contents of `supabase-setup.sql` → Run
4. Go to **Storage** → create a new bucket named `photos` → set it to **Public**
5. Go to **Project Settings → API** → copy:
   - Project URL
   - `anon` public key

### 2. Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push your project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import project from GitHub
3. Add your environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy 🚀

Your site will be live at `your-project.vercel.app`

---

## Features

- 📖 Notebook page-flip navigation (arrow keys work too)
- ✍️ Write entries with optional title + auto date
- 📸 Upload photos with captions (scrapbook style)
- 🌙 Dark mode (soft rose night mode)
- ✦ Random page button
- 📱 Mobile friendly
- 🗑️ Edit & delete entries
