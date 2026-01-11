# Deployment Guide

This guide walks you through deploying the CMS application to production.

## Architecture

- **Web App**: Deployed on Vercel (React static hosting)
- **API + Worker**: Deployed on Railway (Docker-based deployment)
- **Database**: Managed PostgreSQL on Railway

## Prerequisites

1. GitHub account (or GitLab/Bitbucket)
2. Vercel account (free tier works)
3. Railway account (free tier works)

## Step 1: Deploy Database and API to Railway

### Option A: Using Railway Docker Compose (Recommended)

1. **Create Railway account**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. **Add Service** → **Docker Compose**
5. Upload or paste your `docker-compose.yml` content
6. **Set Environment Variables**:
   - `JWT_SECRET`: Generate a strong secret (use `openssl rand -base64 32`)
   - `DATABASE_URL`: Railway will auto-generate this for PostgreSQL
   - `NODE_ENV`: `production`

7. Railway will:
   - Create a PostgreSQL database automatically
   - Deploy API, Worker, and Database services
   - Provide public URLs

8. **Copy the API URL**: Railway provides a public URL like `https://your-api.up.railway.app`

### Option B: Using Railway Individual Services

1. **Create Project** on Railway
2. **Add PostgreSQL**: New → Database → PostgreSQL
3. **Copy DATABASE_URL** from the database service

4. **Add API Service**:
   - New → GitHub Repo → Select your repo
   - Root Directory: `/api`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && npm start`
   - Environment Variables:
     - `DATABASE_URL`: (from PostgreSQL service)
     - `JWT_SECRET`: (generate strong secret)
     - `PORT`: `3001`
     - `NODE_ENV`: `production`

5. **Add Worker Service**:
   - New → GitHub Repo → Select your repo
   - Root Directory: `/worker`
   - Build Command: `cp -r ../api/prisma ./prisma && npm install && npx prisma generate`
   - Start Command: `node src/worker.js`
   - Environment Variables:
     - `DATABASE_URL`: (same as API, from PostgreSQL service)
     - `NODE_ENV`: `production`

6. **Get Public URLs**: Railway assigns public URLs to each service

## Step 2: Run Database Migrations

After Railway deploys:

1. Go to your API service in Railway
2. Click **Deployments** → **Latest Deployment** → **View Logs**
3. Or use Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```
4. Seed the database (optional):
   ```bash
   railway run node prisma/seed.js
   ```

## Step 3: Deploy Web App to Vercel

1. **Create Vercel account**: https://vercel.com

2. **New Project** → **Import Git Repository**

3. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables**:
   - `VITE_API_URL`: Your Railway API URL (e.g., `https://your-api.up.railway.app`)

5. **Deploy**: Click Deploy

6. **Get Web App URL**: Vercel provides a URL like `https://your-app.vercel.app`

## Step 4: Update API CORS Settings

After deploying the web app, update API CORS to allow your Vercel domain:

1. In Railway API service, add environment variable:
   - `CORS_ORIGIN`: `https://your-app.vercel.app`

2. Redeploy the API service

## Step 5: Update Web App API URL

1. In Vercel project settings
2. Go to **Environment Variables**
3. Update `VITE_API_URL` to your Railway API URL
4. **Redeploy** the web app

## Alternative: Deploy Everything on Railway

If you prefer everything in one place:

1. Deploy web app as a static service on Railway
2. Use Railway's Docker Compose setup
3. Everything runs on Railway (simpler but less optimized)

## Environment Variables Summary

### API Service (Railway)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-strong-secret-here
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-web-app.vercel.app
```

### Worker Service (Railway)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
```

### Web App (Vercel)
```
VITE_API_URL=https://your-api.up.railway.app
```

## Testing Deployment

1. **Web App**: Visit `https://your-app.vercel.app`
2. **API Health**: Visit `https://your-api.up.railway.app/health`
3. **API Catalog**: Visit `https://your-api.up.railway.app/catalog/programs`

## Troubleshooting

### API Returns 502
- Check Railway logs
- Verify DATABASE_URL is correct
- Ensure migrations ran successfully

### Web App Can't Connect to API
- Verify CORS_ORIGIN in API environment variables
- Check VITE_API_URL in Vercel environment variables
- Make sure API is accessible (test with curl)

### Worker Not Running
- Check Railway logs for worker service
- Verify DATABASE_URL matches API service
- Ensure worker service is running (check Railway dashboard)

## Cost Estimate

- **Vercel**: Free tier (hobby plan)
- **Railway**: Free tier includes $5 credit/month (usually enough for small apps)
- **Database**: Included in Railway PostgreSQL

Total: **$0/month** (within free tiers)

## Production Checklist

- [ ] Generate strong JWT_SECRET
- [ ] Run database migrations
- [ ] Seed database (optional, for testing)
- [ ] Set CORS_ORIGIN to your web app domain
- [ ] Verify API is accessible via HTTPS
- [ ] Test login flow
- [ ] Test worker publishing scheduled lessons
- [ ] Monitor logs for errors

## URLs After Deployment

- **Web App**: `https://your-app.vercel.app`
- **API**: `https://your-api.up.railway.app`
- **Database**: Managed by Railway (not directly accessible)

Save these URLs for your deliverables!
