#!/usr/bin/env powershell

# DropshaREV2 - Vercel Deployment Script
# Run this script after deploying to Supabase

Write-Host "🚀 Starting Vercel Deployment..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Login to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Vercel:" -ForegroundColor Yellow
    vercel login
}

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Deploy to Vercel
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Your app should be live!" -ForegroundColor Magenta
Write-Host "Check your Vercel dashboard for the deployment URL" -ForegroundColor White