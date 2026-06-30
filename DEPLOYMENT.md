# Deployment Guide for Trade Master

This guide will help you deploy your full-stack trading education platform.

## Deployment Architecture

| Component | Service | Free Tier Available? |
|-----------|---------|---------------------|
| Frontend  | Vercel  | ✅ Yes |
| Backend   | Render  | ✅ Yes |
| Database  | Render SQLite (built-in)  | ✅ Yes |
| File Storage | Cloudinary (recommended for production) | ✅ Yes |

---

## Step 1: Push to GitHub

First, let's make sure your code is committed and pushed to GitHub.

```bash
# Initialize git if needed (already done)
git init

# Add all files (except those in .gitignore)
git add .

# Commit changes
git commit -m "Initial commit for deployment"

# Create a GitHub repository and push your code
# Follow GitHub instructions to create repo and add remote
git remote add origin https://github.com/[YOUR_USERNAME]/trade-master.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Sign up / log in to [Render](https://render.com)
2. Go to Dashboard → "New" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:
   - **Runtime**: Python 3
   - **Region**: Frankfurt (EU Central) - closest to Tunisia
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under "Environment", add all variables from your `.env` file
   - `STRIPE_SECRET_KEY`, `FLOUCI_APP_TOKEN`, `FLOUCI_APP_SECRET`, etc.
6. Click "Create Web Service"

Once deployed, copy your backend URL (like `https://trade-master-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel

1. Sign up / log in to [Vercel](https://vercel.com)
2. Go to Dashboard → "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: Your Render backend URL from step 2 (e.g., `https://trade-master-backend.onrender.com`)
6. Click "Deploy"

---

## Step 4: Configure CORS on Backend

Make sure your FastAPI backend accepts requests from your new Vercel frontend. In `backend/main.py`, update:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-vercel-domain.vercel.app"  # Add your Vercel URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Optional: Cloudinary for File Uploads

For production file storage (replacing `backend/uploads/`):
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Add Cloudinary credentials to your Render environment variables
3. Update your backend to use Cloudinary instead of local files

---

## Verify Deployment

1. Open your Vercel frontend URL in a browser
2. Test registration, login, and a few features
3. Check that payments (if in test mode) work correctly
4. Check the admin panel

🎉 Congratulations! Your Trade Master website is now live!
