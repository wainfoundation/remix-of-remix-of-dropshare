#!/usr/bin/env powershell

# DropshaREV2 - Supabase Deployment Script
# Run this script to deploy your database and functions to the new Supabase project

Write-Host "🚀 Starting Supabase Deployment..." -ForegroundColor Cyan
Write-Host "Project: vjkpkqajjohqisfzkxvp" -ForegroundColor Green

# Check if Supabase CLI is installed
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Login to Supabase (if not already logged in)
Write-Host "🔐 Checking Supabase authentication..." -ForegroundColor Yellow
supabase auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Supabase:" -ForegroundColor Yellow
    supabase login
}

# Link to the new project
Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref vjkpkqajjohqisfzkxvp

# Push database migrations
Write-Host "📊 Deploying database migrations..." -ForegroundColor Yellow
supabase db push

# Deploy Edge Functions
Write-Host "⚡ Deploying Edge Functions..." -ForegroundColor Yellow
supabase functions deploy

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your Supabase project: https://vjkpkqajjohqisfzkxvp.supabase.co" -ForegroundColor Cyan
Write-Host "📊 Dashboard: https://supabase.com/dashboard/project/vjkpkqajjohqisfzkxvp" -ForegroundColor Cyan

Write-Host "`n🎯 Next steps:" -ForegroundColor Magenta
Write-Host "1. Deploy to Vercel: vercel --prod" -ForegroundColor White  
Write-Host "2. Test your application" -ForegroundColor White
Write-Host "3. Configure domain settings in Vercel" -ForegroundColor White