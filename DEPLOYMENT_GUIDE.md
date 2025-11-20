# Validation System Deployment Guide

This guide walks you through deploying the AI Validation Edge Function to Supabase.

## Prerequisites

- A Supabase project (you already have one)
- `OPENAI_API_KEY` from OpenAI
- Access to your Supabase project dashboard

---

## Option 1: Deploy via Supabase Dashboard (Recommended - No CLI needed)

This is the easiest method if you don't want to install the CLI.

### Step 1: Create the Edge Function in Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **"Create a new function"** or **"New Function"**
5. Name it: `validate`
6. Click **"Create function"**

### Step 2: Copy the Function Code

1. Open `supabase/functions/validate/index.ts` in your code editor
2. Copy the entire file contents
3. In the Supabase Dashboard, paste the code into the function editor
4. Click **"Deploy"** or **"Save"**

### Step 3: Set Environment Variables

1. In the Edge Function page, find the **"Settings"** or **"Environment Variables"** section
2. Add the following environment variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
3. Click **"Save"**

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase.

### Step 4: Test the Function

1. In the Edge Function page, go to the **"Testing"** or **"Invoke"** tab
2. Use this test payload:
   ```json
   {
     "projectId": "your-project-id-here",
     "idea": {
       "title": "Test Idea",
       "summary": "This is a test idea for validation"
     }
   }
   ```
3. Click **"Invoke"** and check the response

---

## Option 2: Deploy via Supabase CLI (For developers)

### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
# Using Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
# Download binary
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -o supabase.zip
# Extract and add to PATH
```

Verify installation:
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
# List your projects
supabase projects list

# Link to your project (replace with your project ref)
supabase link --project-ref your-project-ref
```

**To find your project ref:**
- Go to Supabase Dashboard → Settings → General
- Copy the "Reference ID"

### Step 4: Set Environment Variables

Create a `.env` file in your project root (or use Supabase Dashboard):

```bash
# In Supabase Dashboard → Edge Functions → validate → Settings
# Add: OPENAI_API_KEY = your-key-here
```

Or use CLI:
```bash
supabase secrets set OPENAI_API_KEY=your-key-here
```

### Step 5: Deploy the Function

```bash
# Deploy the validate function
supabase functions deploy validate

# Or deploy all functions
supabase functions deploy
```

### Step 6: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test the function
supabase functions invoke validate --body '{"projectId":"test-id","idea":{"title":"Test"}}'
```

---

## Option 3: Deploy via GitHub Actions (CI/CD)

If you want automated deployments, create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy Functions
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase functions deploy validate --project-ref $SUPABASE_PROJECT_ID
```

---

## Post-Deployment Checklist

### ✅ Verify Function is Deployed

1. Go to Supabase Dashboard → Edge Functions
2. You should see `validate` in the list
3. Check the status is "Active" or "Deployed"

### ✅ Test from Your App

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/project/[your-project-id]/validate`
3. Enter an idea and click "Start Validation"
4. Check the browser console for any errors
5. Check Supabase Dashboard → Logs → Edge Functions for execution logs

### ✅ Verify Database Updates

1. Go to Supabase Dashboard → Table Editor
2. Open `validation_reports` table
3. You should see new rows being created with:
   - `status: 'running'` initially
   - `status: 'succeeded'` after completion
   - Real scores (not all 50%)
   - Rationales in the `rationales` JSONB column

### ✅ Check Function Logs

1. Go to Supabase Dashboard → Edge Functions → validate
2. Click on **"Logs"** tab
3. Look for:
   - Successful invocations
   - Any error messages
   - Execution times

---

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"

**Solution**: Make sure you've set the environment variable in Supabase Dashboard:
- Edge Functions → validate → Settings → Environment Variables

### Error: "Function not found" or 404

**Solution**: 
- Verify the function is deployed: `supabase functions list`
- Check the function name matches exactly: `validate` (lowercase)

### Error: "Supabase configuration missing"

**Solution**: This shouldn't happen as Supabase auto-provides these. If it does:
- Check you're using the latest Supabase client
- Verify your project is properly linked

### Function times out

**Solution**:
- Each agent has a 20s timeout
- Total function timeout is typically 60s (Supabase default)
- If timing out, check OpenAI API status
- Consider reducing timeout or optimizing prompts

### Scores are still all 50%

**Solution**:
- Check function logs for errors
- Verify OpenAI API key is valid
- Check OpenAI API usage/limits
- Test the function directly in Supabase Dashboard

### "Unauthorized" errors

**Solution**:
- Verify project ownership check in the start route
- Check RLS policies on `validation_reports` table
- Ensure user is authenticated via Clerk

---

## Environment Variables Reference

| Variable | Where to Set | Required | Description |
|----------|-------------|----------|-------------|
| `OPENAI_API_KEY` | Supabase Dashboard → Edge Functions → validate → Settings | ✅ Yes | Your OpenAI API key |
| `SUPABASE_URL` | Auto-provided | ✅ Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided | ✅ Yes | Service role key for database access |

---

## Next Steps After Deployment

1. **Monitor Usage**: Check OpenAI API usage to track costs
2. **Optimize Prompts**: Adjust agent prompts based on results
3. **Add Caching**: Consider caching results for identical ideas
4. **Set Up Alerts**: Monitor function errors and timeouts
5. **Scale Testing**: Test with various idea types to ensure quality

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs → Edge Functions
2. Check browser console for client-side errors
3. Verify all environment variables are set
4. Test the function directly in Supabase Dashboard

