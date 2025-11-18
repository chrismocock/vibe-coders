# Deploy to Vercel with Staging Database

This guide walks you through deploying your site to Vercel and configuring it to use your staging Supabase database.

## Prerequisites

- Your code is pushed to GitHub
- You have a Vercel account (sign up at https://vercel.com)
- Your staging Supabase database is set up and ready

## Step 1: Get Your Staging Database Credentials

1. Go to your **Staging Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Staging project**
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`, keep this secret!)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "Add New..."** → **"Project"**
3. **Import your GitHub repository**:
   - Select your `vibe-coders` repository
   - Click **"Import"**
4. **Configure the project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
5. **Click "Deploy"** (we'll add environment variables next)

### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from your project directory)
cd "C:\Users\ChrisMocock\OneDrive - Xpertlink Solutions Ltd\Web Projects\Vibercode\vibe-coders"
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time) or Yes (if updating)
# - Project name: vibe-coders (or your preferred name)
# - Directory: ./
```

## Step 3: Configure Environment Variables in Vercel

After your first deployment, configure environment variables:

### Via Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add the following variables:

#### Required Environment Variables:

**Clerk Authentication:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = your-clerk-publishable-key
CLERK_SECRET_KEY = your-clerk-secret-key
```

**Supabase (Staging Database):**
```
NEXT_PUBLIC_SUPABASE_URL = https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-staging-service-role-key
```

**OpenAI (for AI features):**
```
OPENAI_API_KEY = your-openai-api-key
OPENAI_GPT5_MODEL = gpt-4o (optional)
```

**Important Settings:**
- For each variable, select **"Production"**, **"Preview"**, and **"Development"** environments (or just Production if you only want it there)
- Click **"Save"** after adding each variable

### Via Vercel CLI:

```powershell
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://your-staging-project.supabase.co
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: your-staging-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: your-staging-service-role-key

vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Paste: your-clerk-publishable-key

vercel env add CLERK_SECRET_KEY
# Paste: your-clerk-secret-key

vercel env add OPENAI_API_KEY
# Paste: your-openai-api-key
```

## Step 4: Redeploy

After adding environment variables, you need to redeploy:

### Via Dashboard:
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Confirm the redeploy

### Via CLI:
```powershell
vercel --prod
```

## Step 5: Verify Deployment

1. **Check your deployment URL**: Vercel will provide a URL like `https://vibe-coders.vercel.app`
2. **Test the site**: Visit the URL and verify:
   - Site loads correctly
   - Authentication works (Clerk)
   - Database connections work (Supabase)
   - AI features work (OpenAI)

## Environment-Specific Deployments

You can set up different environments:

### Production (Main branch)
- Uses staging database
- Environment variables set for "Production"

### Preview (Pull Requests)
- Can use staging or dev database
- Environment variables set for "Preview"

### Development (Local)
- Uses your `.env.local` file
- Can point to dev or staging database

## Managing Multiple Environments

If you want different databases for different Vercel environments:

1. **Production**: Use staging database
   - Set `NEXT_PUBLIC_SUPABASE_URL` to staging URL (Production only)

2. **Preview**: Use dev database (optional)
   - Set `NEXT_PUBLIC_SUPABASE_URL` to dev URL (Preview only)

3. **Local Development**: Use dev database
   - Keep `.env.local` with dev credentials

## Troubleshooting

### Error: "Supabase env vars are missing"
**Solution**: Make sure all three Supabase environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Unauthorized" or RLS errors
**Solution**: 
- Verify you're using the correct staging database credentials
- Check that RLS policies are set up correctly in staging database
- Ensure service role key is correct (should start with `eyJ...`)

### Database connection issues
**Solution**:
- Verify the staging database URL is correct
- Check that your staging database is accessible
- Ensure network/firewall settings allow connections

### Build fails
**Solution**:
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (Vercel auto-detects)

## Quick Reference

**Environment Variables Needed:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL (staging)
NEXT_PUBLIC_SUPABASE_ANON_KEY (staging)
SUPABASE_SERVICE_ROLE_KEY (staging)
OPENAI_API_KEY
```

**Vercel Dashboard**: https://vercel.com/dashboard
**Supabase Dashboard**: https://supabase.com/dashboard

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure environment variables
3. ✅ Test the deployment
4. ✅ Set up custom domain (optional)
5. ✅ Configure automatic deployments from GitHub (enabled by default)

