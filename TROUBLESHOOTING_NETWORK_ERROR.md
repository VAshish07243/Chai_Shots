# Troubleshooting "Network Error" After Deployment

If you're seeing "Network error. Please check if API is running." after setting environment variables, follow these steps:

## Step 1: Verify Your Railway API URL

1. Go to **Railway Dashboard** → Your project
2. Click on your **API service**
3. Click **"Settings"** tab (or look for "Networking" / "Public Networking")
4. Find your **Public URL** or **Public Domain**
   - Should look like: `https://chaishots-production-3d9d.up.railway.app`
5. **Copy this URL** - you'll need it

## Step 2: Test API is Accessible

1. Open a **new browser tab** (not your Vercel app)
2. Visit: `https://YOUR-RAILWAY-API-URL/health`
   - Replace `YOUR-RAILWAY-API-URL` with the URL from Step 1
   - Example: `https://chaishots-production-3d9d.up.railway.app/health`
3. You should see: `{"status":"ok","database":"connected"}`
   - ✅ If you see this: API is running! Go to Step 3
   - ❌ If you get an error or timeout: Your API isn't running - check Railway logs

## Step 3: Verify Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your project
2. Click **"Settings"** tab (top menu)
3. Click **"Environment Variables"** (left sidebar)
4. Look for `VITE_API_URL`
   - ✅ **Should EXIST** and match your Railway API URL exactly
   - ❌ **If MISSING or WRONG**: 
     - Click **"+ Add"** or **"Add New"**
     - **Key**: `VITE_API_URL`
     - **Value**: Your Railway API URL (from Step 1)
       - Example: `https://chaishots-production-3d9d.up.railway.app`
       - ⚠️ **Important**: Include `https://`, NO trailing slash
     - **Environment**: Select **"Production"** (or all three)
     - Click **"Save"**

## Step 4: Redeploy Vercel (CRITICAL!)

**⚠️ IMPORTANT**: After adding/changing `VITE_API_URL`, you MUST redeploy:

1. In Vercel project, go to **"Deployments"** tab
2. Click the **"..."** menu (three dots) on the **latest deployment**
3. Click **"Redeploy"**
4. Wait 1-3 minutes for redeployment to complete
5. Click **"Visit"** or refresh your app

**Why**: Vite environment variables are baked into the build at build time. Changing them in settings doesn't update the deployed code - you need to rebuild!

## Step 5: Verify Railway CORS Variable

1. Go to **Railway Dashboard** → Your project
2. Click on your **API service** (not PostgreSQL or Worker)
3. Click **"Variables"** tab
4. Look for `CORS_ORIGIN`
   - ✅ **Should EXIST** and match your Vercel URL
   - ❌ **If MISSING**:
     - Click **"+ New Variable"**
     - **Name**: `CORS_ORIGIN`
     - **Value**: Your Vercel app URL
       - Example: `https://your-project-name.vercel.app`
       - Get this from: Vercel → Your project → Settings → Domains
       - ⚠️ **Important**: Include `https://`, NO trailing slash
     - Click **"Add"** or **"Save"**

## Step 6: Redeploy Railway API

1. Still in Railway API service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button
4. Wait 1-2 minutes
5. Check **"Logs"** to ensure it started successfully

## Step 7: Check Browser Console

1. Open your Vercel web app
2. Press **F12** (or Right-click → Inspect)
3. Click **"Console"** tab
4. Look for errors - they'll tell you exactly what's wrong:
   - `CORS policy` error → CORS not configured correctly
   - `Failed to fetch` → API URL wrong or API not accessible
   - `404 Not Found` → API URL path is wrong
   - `Network request failed` → API is down or URL is wrong

## Step 8: Verify URLs Match Exactly

Double-check these URLs match exactly (no typos, no extra spaces):

**Vercel Environment Variable (`VITE_API_URL`):**
- ✅ Should be: `https://chaishots-production-3d9d.up.railway.app`
- ❌ Wrong: `http://chaishots-production-3d9d.up.railway.app` (http instead of https)
- ❌ Wrong: `https://chaishots-production-3d9d.up.railway.app/` (trailing slash)
- ❌ Wrong: `https:// chaishots-production-3d9d.up.railway.app` (extra space)

**Railway CORS Variable (`CORS_ORIGIN`):**
- ✅ Should be: `https://your-project-name.vercel.app`
- ❌ Wrong: `http://your-project-name.vercel.app` (http instead of https)
- ❌ Wrong: `https://your-project-name.vercel.app/` (trailing slash)

## Common Issues:

### Issue 1: "Environment variable not found" in browser console
**Solution**: You didn't redeploy Vercel after adding the variable (see Step 4)

### Issue 2: "CORS policy" error in browser console
**Solution**: CORS_ORIGIN not set in Railway, or API not redeployed (see Steps 5-6)

### Issue 3: "Failed to fetch" or "Network request failed"
**Solution**: API URL is wrong, or API is not accessible (see Steps 1-2)

### Issue 4: API health check fails
**Solution**: Railway API service is down - check Railway logs and redeploy

## Quick Test:

1. **API Health**: Visit `https://YOUR-RAILWAY-API-URL/health` in a new tab
   - Should return: `{"status":"ok","database":"connected"}`
   
2. **Browser Console**: Open your Vercel app → F12 → Console tab
   - Look for the actual error message - it will tell you what's wrong

3. **Check Network Tab**: F12 → Network tab → Try logging in → Look at failed requests
   - Click on the failed request → Check the "Request URL" - is it correct?
   - Check "Response" - what error does it show?
