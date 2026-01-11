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

**Step 1.1: Create Railway Account**
1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

**Step 1.2: Create New Project**
1. After logging in, click **"New Project"** button (top right)
2. Select **"Deploy from GitHub repo"**
3. If this is your first time, authorize Railway to access your GitHub
4. Select your repository from the list (the one containing this CMS project)
5. Click **"Deploy Now"**

**Step 1.3: Add Services to Railway**

Railway doesn't have a direct "Docker Compose" option in the UI. Instead, we'll add services individually:

**Option 1: Add API Service First**
1. In your Railway project dashboard, click **"+ New"** button
2. Select **"GitHub Repo"** (or **"Empty Service"** if you prefer)
3. If using GitHub Repo:
   - Select your repository
   - Railway will auto-detect it's a Node.js project
4. Click on the newly created service
5. Go to **"Settings"** tab
6. Set **"Root Directory"**: `/api`
7. Railway will automatically detect the Dockerfile in `/api/Dockerfile`

**Option 2: Use Railway's Dockerfile Detection**
1. Railway will automatically use the `Dockerfile` in your `/api` directory
2. If you want to use Docker Compose, you'll need to use Option B (Individual Services) instead
3. For simplicity, we'll use individual services (see Option B below)

**Step 1.4: Configure the Auto-Created Service as API**
1. Click on the service that Railway auto-created (it might be named after your repo)
2. Go to **"Settings"** tab
3. Find **"Root Directory"** field and set it to: `/api`
4. Railway will automatically detect the Dockerfile in `/api/Dockerfile` and use it
5. Go to **"Variables"** tab
6. You should already see `DATABASE_URL` (automatically added from PostgreSQL service)
7. Click **"+ New Variable"** and add these one by one:

   **Variable 1: JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: Generate a strong secret using one of these methods:
     - **Windows PowerShell**: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
     - **Online**: Use https://randomkeygen.com (use "CodeIgniter Encryption Keys")
     - **Manual**: Any long random string (at least 32 characters)
   - Example: `aB3xK9mP2qR7vN5tY8wE1uI6oA4sD0fG2hJ9kL3zX5cV8bN1mM4qW7eR0tY3uI6oP9aS2dF5gH8jK1lZ4xC7vB0nM3qW6eR9tY2uI5oP8aS1dF4gH7jK0lZ3x`
   - Click **"Add"** to save

   **Variable 2: NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click **"Add"** to save

   **Variable 3: PORT**
   - Name: `PORT`
   - Value: `3001`
   - Click **"Add"** to save

   **Variable 4: CORS_ORIGIN** (set this after deploying web app - skip for now)
   - Name: `CORS_ORIGIN`
   - Value: `https://your-web-app.vercel.app` (you'll update this in Step 4)
   - You can add this later, skip it for now

8. Railway will automatically redeploy the API service after you save variables

**Step 1.5: Add PostgreSQL Database**

**What you're doing**: Adding a separate database service to store all your data (programs, lessons, users, etc.)

**Why separate**: Railway treats the database as its own managed service, which means Railway handles backups, updates, and maintenance automatically.

**Step-by-step**:
1. In your Railway project dashboard, look for the **"+ New"** button (usually in the top right corner of the project view)
2. Click **"+ New"** and you'll see a dropdown menu
3. In the dropdown, hover over or click **"Database"** 
4. Then select **"Add PostgreSQL"** from the submenu
5. Railway will now:
   - **Create a PostgreSQL database** on their servers (this is where all your data will be stored)
   - **Generate a connection string** called `DATABASE_URL` (this is like an address that tells your API and Worker how to connect to the database)
   - **Automatically share this `DATABASE_URL`** with all other services in your project (so your API and Worker can access it)

6. **Wait ~30 seconds** - You'll see a loading indicator while Railway sets up the database
7. Once it's done, you'll see a new service card in your dashboard labeled "PostgreSQL" or "Postgres"
8. **Important**: The `DATABASE_URL` is automatically added to your API and Worker services' environment variables - you don't need to copy/paste it manually!

**What this means**: Your API and Worker services can now connect to the database using the `DATABASE_URL` that Railway automatically provided. You'll see it in their "Variables" tab.

**Step 1.6: Add Worker Service**
1. In Railway project dashboard, click **"+ New"** button again (top right)
2. Select **"GitHub Repo"** from the dropdown (same repository you used before)
3. Railway will create a new service
4. Click on the newly created service
5. Go to **"Settings"** tab
6. **Important - Build Context Issue**: Railway might be building from the worker directory, which causes path issues. Try one of these:

   **Option A: Set Root Directory to repo root**
   - **Root Directory**: Leave empty or set to `/` (repo root)
   - **Dockerfile Path**: Set to `worker/Dockerfile`
   - This makes Railway build from repo root, so paths like `api/prisma` and `worker/src` work

   **Option B: If Option A doesn't work, use Root Directory `/worker`**
   - **Root Directory**: Set to `/worker`
   - Railway will build from the worker directory
   - The Dockerfile will need different paths (see troubleshooting below)

7. If you get build errors about paths not found:
   - Check the build logs to see what directory Railway is using as build context
   - The error will show which paths it's looking for
   - You may need to adjust the Dockerfile paths based on the actual build context

8. Go to **"Variables"** tab
9. **Check for DATABASE_URL**:
   - **If you see `DATABASE_URL`** already listed: Great! Railway automatically added it. Skip to step 9.
   - **If you DON'T see `DATABASE_URL`**: You need to add it manually (see steps below)

   **To manually add DATABASE_URL** (if it's missing):
   - Go to your **PostgreSQL service** in Railway dashboard
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - Find `DATABASE_URL` and **copy the entire value** (it's a long string starting with `postgresql://`)
   - Go back to your **Worker service** → **"Variables"** tab
   - Click **"+ New Variable"**
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the value you copied from PostgreSQL
   - Click **"Add"** to save

9. Click **"+ New Variable"** and add:
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - Click **"Add"** to save
10. Railway will automatically deploy the worker service

**Step 1.7: Get Your API URL**
1. Wait for the API service to finish deploying (check the **"Deployments"** tab)
2. Go to your **API service** in the dashboard
3. Go to **"Settings"** tab
4. Scroll down to **"Networking"** section
5. Under **"Public Domain"**, click **"Generate Domain"** button
6. Railway will create a public URL (looks like: `https://your-api-name.up.railway.app`)
7. **Copy this URL** - you'll need it for the web app deployment
8. The URL will be something like: `https://api-production-xxxx.up.railway.app`

**Step 1.8: Verify Deployment**

**First, check if the service is actually running:**
1. Go to your **API service** in Railway dashboard (not PostgreSQL - the API service)
2. Click on the **"Deployments"** tab
3. Check the **latest deployment** - it should show "Active" or "Success"
4. Click **"View Logs"** to see what's happening
5. Look for these messages:

   **✅ Good signs (service is working):**
   - `"API server running on port 3001"` - Service started successfully!
   - `"Prisma Migrate applied X migration(s)"` or `"No migration found"` - Migrations ran
   - No error messages about database connection

   **❌ Bad signs (service has issues):**
   - `"PrismaClientInitializationError"` - Can't connect to database
   - `"Error: P1001: Can't reach database server"` - DATABASE_URL is wrong
   - `"EADDRINUSE: address already in use"` - PORT conflict
   - Service keeps restarting/crashing
   - No `"API server running"` message

**If deployment shows as successful but you get "Not Found":**

**Check 1: Is the domain generated?**
1. Go to API service → **"Settings"** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, make sure there's a domain listed
4. If it says "No domain" or is empty, click **"Generate Domain"** button
5. Wait a few seconds for Railway to provision the domain
6. Copy the domain URL (it looks like: `https://your-service-name.up.railway.app`)

**Check 2: Is the service actually listening?**
1. Check the deployment logs for: `"API server running on port 3001"`
2. If you don't see this, the service might have crashed
3. Check for error messages in the logs

**Check 3: Try the health endpoint:**
1. Use the domain from Check 1
2. Visit: `https://your-api-domain.up.railway.app/health`
3. You should see: `{"status":"ok","database":"connected"}`
4. If you still see "Not Found", the service might not be running

**Check 4: Verify environment variables (CRITICAL - This is likely your issue!):**
1. Go to **API service** → **"Variables"** tab (NOT PostgreSQL service)
2. **Check if DATABASE_URL exists:**
   - If you see `DATABASE_URL` listed: Check its value matches PostgreSQL
   - If you DON'T see `DATABASE_URL`: You need to add it (see steps below)

3. **To add DATABASE_URL to API service:**
   - Go to **PostgreSQL service** → **"Variables"** tab
   - Find `DATABASE_URL` and **copy the entire value**
   - It should be: `postgresql://postgres:JlXEcqrdRQWgJRVdjTkTHcMiDWfyTtsK@postgres.railway.internal:5432/railway`
   - Go back to **API service** → **"Variables"** tab
   - Click **"+ New Variable"**
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the exact value from PostgreSQL (no quotes, no spaces)
   - Click **"Add"** to save
   - Railway will automatically redeploy the API service

4. **Verify all required variables are set:**
   - `DATABASE_URL` = (from PostgreSQL service)
   - `PORT` = `3001`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (your generated secret)

**Check 5: Check if migrations ran:**
1. Look at the deployment logs
2. You should see: `"Prisma Migrate applied X migration(s)"` or `"No migration found"`
3. If you see migration errors, the database might not be connected

**Check 6: Database Connection Issues (if you see "invalid length of startup packet" in PostgreSQL logs):**

This error means something is trying to connect to PostgreSQL with a malformed connection string.

**Your DATABASE_URL should look like this:**
```
postgresql://postgres:JlXEcqrdRQWgJRVdjTkTHcMiDWfyTtsK@postgres.railway.internal:5432/railway
```

**Important points:**
- ✅ Uses `postgresql://` (correct protocol)
- ✅ Uses `postgres.railway.internal` (Railway's internal hostname - this is correct for services in the same project)
- ✅ Format: `postgresql://username:password@host:port/database`

**To fix the connection issue:**

1. **In API service → Variables tab:**
   - Find `DATABASE_URL`
   - Make sure the value is EXACTLY: `postgresql://postgres:JlXEcqrdRQWgJRVdjTkTHcMiDWfyTtsK@postgres.railway.internal:5432/railway`
   - **No quotes** around it
   - **No spaces** before or after
   - **No line breaks**
   - If it's different, delete it and add it again with the exact value

2. **In Worker service → Variables tab:**
   - Do the same - use the exact same DATABASE_URL value

3. **After updating DATABASE_URL:**
   - Railway will automatically redeploy the services
   - Check the deployment logs
   - You should see: `"API server running on port 3001"` (no connection errors)

4. **If you still see "invalid length of startup packet":**
   - The DATABASE_URL might have hidden characters
   - Delete the variable completely
   - Add it again by typing it manually (don't copy-paste if copy-paste added extra characters)
   - Or copy from PostgreSQL service → Variables tab again

**If still getting "Not Found" after all checks:**
- The service might have crashed during startup
- Check the logs for the exact error message
- Common issues: 
  - Missing or incorrect DATABASE_URL format
  - Wrong PORT environment variable
  - Prisma connection errors
  - Service crashed before it could start listening

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

**Important**: If you used Option A (Docker Compose), migrations run automatically. Skip to Step 2.2.

**⚠️ Step 2.0: Create Initial Migration (If Not Already Created)**

**Check if migrations exist:**
1. Look in your repo at `api/prisma/migrations/`
2. If the folder is **empty**, you need to create migrations first

**Create initial migration locally:**
1. Make sure Docker is running and your local database is up:
   ```bash
   docker compose up db -d
   ```

2. Run the migration command:
   ```bash
   docker compose exec api npx prisma migrate dev --name init
   ```

3. **Commit and push** the new migration files to your GitHub repo:
   ```bash
   git add api/prisma/migrations/
   git commit -m "Add initial database migration"
   git push
   ```

4. **Redeploy** your API service in Railway so it picks up the new migration files

**If migrations already exist** (you see `.sql` files in `api/prisma/migrations/`), skip to Step 2.1.

**Step 2.1: Check if Migrations Ran (Docker Compose)**
1. Go to your Railway project dashboard
2. Click on the **API service**
3. Go to **"Deployments"** tab
4. Click on the **latest deployment**
5. Click **"View Logs"**
6. Look for: `"Prisma Migrate applied X migration(s)"` or `"No migration found"`
7. If you see this, migrations already ran! ✅ Skip to Step 2.3

**Step 2.2: Run Migrations Manually (Individual Services Only)**

**Method 1: Migrations Run Automatically (Recommended)**
If your API service uses the Dockerfile with `prisma migrate deploy`, migrations run automatically when the service starts. Check the API service logs - you should see migration messages.

**Method 2: Check if Migrations Ran**
1. Go to your **API service** in Railway
2. Go to **"Deployments"** tab
3. Click **"View Logs"** on the latest deployment
4. Look for:
   - `"Prisma Migrate applied X migration(s)"` - Migrations ran! ✅
   - `"No migration found"` - No migrations to run (schema is already up to date) ✅
   - Database connection errors - DATABASE_URL is missing or wrong ❌

**⚠️ Important:** If you only see `"Starting Container"` and `"GET /health"` in your logs, this means migrations haven't run yet. You need to **redeploy** the API service so it uses the updated Dockerfile that runs migrations automatically. See Method 3 below.

**Method 3: Force Migrations to Run (if needed)**
1. Go to API service → **"Deployments"** tab
2. Click **"Redeploy"** button
3. Migrations will run automatically during deployment
4. Check logs to verify migrations ran

**Method 4: Use Railway CLI (Optional - if web interface doesn't work)**
The Railway CLI installation script may have issues. Instead:
1. Download Railway CLI manually: https://github.com/railwayapp/cli/releases
2. Or use npm to install globally:
   ```bash
   npm install -g @railway/cli
   ```
3. Login: `railway login`
4. Link project: `railway link`
5. Run migrations: `railway run npx prisma migrate deploy`

**Step 2.3: Seed Database (Optional - for testing)**

⚠️ **Note:** Seeding is completely optional - it only creates demo data for testing. You can skip this and proceed with deployment. You can always create data manually through the CMS interface once deployed.

1. This creates sample data (users, programs, lessons)
2. **Use Railway CLI (Recommended)**:
   
   **First, install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```
   
   **Then, run these commands:**
   ```bash
   # 1. Login to Railway (opens browser for authentication)
   railway login
   
   # 2. Link to your Railway project (select your project from the list)
   railway link
   
   # 3. Run the seed script
   # Option A: From repo root, specify the service name (check Railway dashboard for exact name)
   railway run --service api node api/prisma/seed.js
   
   # Option B: If service name doesn't work, try without --service flag
   # (Railway will prompt you to select the service)
   cd api
   railway run node prisma/seed.js
   ```
   
   **⚠️ Important:** The service name must match exactly what you see in Railway dashboard (case-sensitive). Common names: `api`, `API`, `chaishots-api`, etc. Check your Railway dashboard to see the exact service name.

3. **What you'll see:**
   - The seed script will create sample users, programs, terms, and lessons
   - You should see console logs like: `"Created users: ..."`, `"Created programs: ..."`, etc.
   - Demo credentials will be available: `admin@example.com / admin123`, `editor@example.com / editor123`, `viewer@example.com / viewer123`

4. **Note**: Only seed once! Re-seeding will create duplicate data. If you need to re-seed, you'll need to delete the database or clear the tables first.

**Troubleshooting Railway CLI:**

- **"Service not found" error:**
  - Make sure you've run `railway link` first (this links your local directory to the Railway project)
  - The service name must match exactly what's in Railway dashboard (check your Railway project → Services → see the service name)
  - Try running without `--service` flag: `cd api && railway run node prisma/seed.js` (Railway will prompt you to select the service)
  
- If `railway login` fails, try downloading CLI manually from: https://github.com/railwayapp/cli/releases

- If `railway link` doesn't show your project, make sure you're logged in and the project exists in Railway dashboard

- **"@prisma/client did not initialize yet" error (even with `railway run`):**
  - Railway CLI might not be executing remotely properly
  - **Solution 1 (Recommended):** Skip seeding for now - it's optional! You can proceed to Step 3 (Deploy Web App). You can create data manually through the CMS interface once deployed.
  - **Solution 2:** Railway's web interface cannot run custom scripts - it can only:
    - View logs (Service → Deployments → View Logs)
    - Redeploy services (Service → Deployments → Redeploy)
    - Manage environment variables (Service → Variables)
    - View database connection info (PostgreSQL service → Connect)
  - If you really need demo data, you can create users/programs manually through the deployed CMS interface
  
- **Railway CLI not working / running locally instead of remotely:**
  - If Railway CLI keeps running commands locally (you see local file paths in errors), Railway CLI might not be properly configured
  - **Workaround:** Skip seeding - it's optional! Proceed with deployment and create data manually through the CMS
  
- If the seed script fails, check that:
  - Migrations have been applied (see Step 2.2)
  - `DATABASE_URL` is set in Railway (it should be auto-added from PostgreSQL service)
  - You're running the command from the correct directory (repo root or `api` folder)
  - You're using Railway CLI (not running locally) - Railway handles the environment setup

## Step 3: Deploy Web App to Vercel

### Step 3.1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"** (or **"Log In"** if you have an account)
3. Sign up with GitHub, GitLab, or Bitbucket (recommended - easier to import repos)

### Step 3.2: Import Your Repository
1. After logging in, click **"+ New Project"** (or **"Add New..."** → **"Project"**)
2. If prompted, authorize Vercel to access your Git provider (GitHub/GitLab/Bitbucket)
3. Find and select your repository (the one with your CMS code)
4. Click **"Import"**

### Step 3.3: Configure Project Settings

**After importing, you'll see the "Configure Project" page. Here's what to do:**

**Option A: If you see a "Framework Preset" dropdown:**
1. **Framework Preset**: Select **"Vite"** from the dropdown
   - If you don't see Vite, select **"Other"** or **"Create React App"** (Vite will auto-detect)
2. **Root Directory**: Click **"Edit"** next to Root Directory, enter: `web`
3. **Build Command**: Should auto-fill as `npm run build` (if not, enter it)
4. **Output Directory**: Should auto-fill as `dist` (if not, enter it)
5. **Install Command**: Should auto-fill as `npm install` (if not, enter it)

**Option B: If you DON'T see these options (Vercel auto-detected settings):**
1. Look for a button/link that says **"Configure Project"**, **"Override"**, or **"Show Advanced"**
2. Click it to reveal the settings above
3. OR, if you don't see these options at all, that's okay - proceed to Step 3.4 (you can configure later)

**Option C: If Vercel shows "Deploy" button immediately:**
1. That's fine! Click **"Deploy"** first
2. After deployment, go to **Project Settings** → **General** to update settings if needed

### Step 3.4: Add Environment Variable

**Before deploying (or after, if you deployed first):**

1. On the "Configure Project" page, scroll down to find **"Environment Variables"** section
   - OR if you already deployed, go to: **Project** → **Settings** → **Environment Variables**

2. Click **"+ Add"** or **"Add New"**

3. Add this variable:
   - **Key/Name**: `VITE_API_URL`
   - **Value**: Your Railway API URL
     - Example: `https://chaishots-production-3d9d.up.railway.app`
     - Get this from Railway dashboard → API service → Public URL
   - **Environment**: Select **"Production"** (or all three: Production, Preview, Development)
   - Click **"Save"**

### Step 3.5: Deploy
1. Click the **"Deploy"** button (usually at the bottom of the page)
2. Wait for deployment (~1-3 minutes)
3. You'll see build logs - wait for it to complete

### Step 3.6: Get Your Web App URL
1. After deployment completes, you'll see a **"Visit"** button
2. Click it to see your deployed app
3. Your URL will be something like: `https://your-project-name.vercel.app`
4. **Copy this URL** - you'll need it for Step 4 (CORS configuration)

**Note:** If you need to update settings after deployment:
- Go to your project dashboard
- Click **"Settings"** tab
- Click **"General"** for build settings
- Click **"Environment Variables"** for environment variables
- Make changes, then click **"Redeploy"** in the **"Deployments"** tab

## Step 4: Update API CORS Settings

**Why**: Your API needs to allow requests from your Vercel web app domain.

**Step 4.1: Add CORS Environment Variable**
1. Go back to Railway dashboard
2. Click on your **API service**
3. Go to **"Variables"** tab
4. Click **"+ New Variable"**
5. Add:
   - **Name**: `CORS_ORIGIN`
   - **Value**: Your Vercel web app URL from Step 3.6
     - Example: `https://your-project-name.vercel.app`
   - **Important**: Include `https://` but no trailing slash
6. Click **"Add"** to save

**Step 4.2: Redeploy API Service**
1. Still in the API service, go to **"Deployments"** tab
2. Click **"Redeploy"** button (or the three dots menu → **"Redeploy"**)
3. Wait for redeployment to complete (~1-2 minutes)
4. Check logs to ensure it started successfully
5. Your API will now accept requests from your Vercel domain

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
