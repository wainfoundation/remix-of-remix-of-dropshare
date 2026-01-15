# SUPABASE MIGRATION AND DEPLOYMENT GUIDE

## 🚀 DEPLOYMENT CHECKLIST - UPDATED TO NEW SUPABASE PROJECT

### ✅ COMPLETED UPDATES

1. **Environment Configuration Updated**
   - `.env` - Updated with new credentials
   - `.env.production` - Created for production deployment
   - `.env.local` - Created with all variables for local development
   - `vercel.json` - Created for Vercel deployment configuration

2. **Supabase Configuration Updated**
   - Project ID: `vjkpkqajjohqisfzkxvp`
   - URL: `https://vjkpkqajjohqisfzkxvp.supabase.co`
   - Anon Key: Updated
   - Service Role Key: Added for backend functions

### 📋 NEXT STEPS TO COMPLETE DEPLOYMENT

#### STEP 1: RUN DATABASE MIGRATIONS
You need to apply your database schema to the new Supabase project:

```bash
# Login to Supabase CLI
npx supabase login

# Link to your new project
npx supabase link --project-ref vjkpkqajjohqisfzkxvp

# Push migrations to new database
npx supabase db push
```

#### STEP 2: DEPLOY EDGE FUNCTIONS
Deploy your Pi Auth and Payment functions:

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy pi-auth
npx supabase functions deploy pi-payment  
npx supabase functions deploy pi-ads
```

#### STEP 3: SET ENVIRONMENT VARIABLES IN SUPABASE
Go to your Supabase dashboard and set these environment variables for Edge Functions:
- `PI_API_KEY`: `ihhnkasxaeldd4qvjpo8d7b5kckuppgaoudoyugfvfa2joc0ardel82qrkzgqrlu`
- `SUPABASE_URL`: `https://vjkpkqajjohqisfzkxvp.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzNzk1OCwiZXhwIjoyMDg0MDEzOTU4fQ.Z6EaPG_SW_goXmeWeq-flH7FzMTWbmHW_T2LhZ9VCHg`

#### STEP 4: DEPLOY TO VERCEL
1. **Connect GitHub Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the framework (Vite)

2. **Set Environment Variables in Vercel Dashboard**
   ```
   VITE_SUPABASE_URL=https://vjkpkqajjohqisfzkxvp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5NTgsImV4cCI6MjA4NDAxMzk1OH0.H8tzoj9fzEq9t5XDo1hGwuTY8CMDDE7_tawdGS0XIS0
   VITE_SUPABASE_PROJECT_ID=vjkpkqajjohqisfzkxvp
   PI_API_KEY=ihhnkasxaeldd4qvjpo8d7b5kckuppgaoudoyugfvfa2joc0ardel82qrkzgqrlu
   ```

3. **Deploy**
   - Click "Deploy" in Vercel
   - Your app will be available at your Vercel domain

### 🧪 TESTING CHECKLIST

#### Local Testing
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Production Testing
- [ ] Authentication works with Pi Network
- [ ] Posts, Reels, and Stories load correctly
- [ ] Ad network integration functions
- [ ] Payment processing works
- [ ] All API endpoints respond correctly

### 🔑 CREDENTIALS SUMMARY

**Project:** vjkpkqajjohqisfzkxvp
**URL:** https://vjkpkqajjohqisfzkxvp.supabase.co
**Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5NTgsImV4cCI6MjA4NDAxMzk1OH0.H8tzoj9fzEq9t5XDo1hGwuTY8CMDDE7_tawdGS0XIS0
**Service Role Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzNzk1OCwiZXhwIjoyMDg0MDEzOTU4fQ.Z6EaPG_SW_goXmeWeq-flH7FzMTWbmHW_T2LhZ9VCHg

### 📁 FILES UPDATED
- [.env](/.env) - Development environment variables
- [.env.production](/.env.production) - Production environment variables  
- [.env.local](/.env.local) - Local development with all variables
- [vercel.json](/vercel.json) - Vercel deployment configuration
- [supabase/config.toml](/supabase/config.toml) - Supabase project configuration

### 🛠️ DATABASE MIGRATIONS TO APPLY
1. `20260114060104_remix_migration_from_pg_dump.sql` - Main schema
2. `20260114120000_add_title_description.sql` - Title/description fields
3. `20260114130000_add_hashtags_trending.sql` - Hashtags and trending

**Run these with:** `npx supabase db push`

---

## 🎯 READY FOR DEPLOYMENT!

Your DropshaREV2 project is now configured for your new Supabase backend. Follow the steps above to complete the migration and deployment to Vercel.