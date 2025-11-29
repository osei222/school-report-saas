# School Report SaaS - Deployment Guide

## Frontend Deployment (Netlify)

### 1. Prepare Repository
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Netlify
1. Go to [Netlify](https://netlify.app) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `frontend`

### 3. Environment Variables
Add these in Netlify dashboard under Site settings > Environment variables:
- `VITE_API_BASE`: Your Render backend URL (e.g., `https://your-app.onrender.com/api`)

## Backend Deployment (Render)

### 1. Deploy to Render
1. Go to [Render](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: Your app name
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn school_report_saas.wsgi:application`

### 2. Environment Variables
Add these in Render dashboard under Environment:
```
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
NETLIFY_URL=https://your-netlify-app.netlify.app
```

### 3. Database
Render will automatically create a PostgreSQL database and set the DATABASE_URL.

## After Deployment

1. Update CORS settings in backend with your Netlify URL
2. Update frontend API base URL with your Render URL
3. Test the application end-to-end

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```