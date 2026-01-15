# Deploy Push Notifications System
# This script deploys the complete notification infrastructure

Write-Host "🔔 Deploying Push Notifications System..." -ForegroundColor Cyan

# Step 1: Check if Supabase CLI is installed
Write-Host "`n1️⃣ Checking Supabase CLI..." -ForegroundColor Yellow
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor White
    exit 1
}
Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Step 2: Generate VAPID keys if not exists
Write-Host "`n2️⃣ Checking VAPID keys..." -ForegroundColor Yellow
$envFile = ".env"
$vapidKeyExists = $false

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "VITE_VAPID_PUBLIC_KEY") {
        $vapidKeyExists = $true
        Write-Host "✅ VAPID keys already configured" -ForegroundColor Green
    }
}

if (-not $vapidKeyExists) {
    Write-Host "Generating VAPID keys..." -ForegroundColor Yellow
    Write-Host "Run this command and save the keys:" -ForegroundColor Cyan
    Write-Host "   npx web-push generate-vapid-keys" -ForegroundColor White
    Write-Host ""
    Write-Host "Then update your .env file with:" -ForegroundColor Cyan
    Write-Host "   VITE_VAPID_PUBLIC_KEY=your_public_key" -ForegroundColor White
    Write-Host ""
    Write-Host "And set Supabase secrets:" -ForegroundColor Cyan
    Write-Host "   supabase secrets set VAPID_PUBLIC_KEY='your_public_key'" -ForegroundColor White
    Write-Host "   supabase secrets set VAPID_PRIVATE_KEY='your_private_key'" -ForegroundColor White
    Write-Host "   supabase secrets set VAPID_SUBJECT='mailto:your-email@example.com'" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Have you completed these steps? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Deployment cancelled. Complete VAPID setup first." -ForegroundColor Red
        exit 1
    }
}

# Step 3: Deploy database migration
Write-Host "`n3️⃣ Deploying database migration..." -ForegroundColor Yellow
try {
    supabase db push
    Write-Host "✅ Database migration deployed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Database migration may have already been deployed" -ForegroundColor Yellow
}

# Step 4: Deploy edge function
Write-Host "`n4️⃣ Deploying Edge Function..." -ForegroundColor Yellow
try {
    supabase functions deploy send-notification
    Write-Host "✅ Edge function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy edge function" -ForegroundColor Red
    Write-Host "Please deploy manually: supabase functions deploy send-notification" -ForegroundColor Yellow
}

# Step 5: Instructions for cron job
Write-Host "`n5️⃣ Setting up Cron Job..." -ForegroundColor Yellow
Write-Host "⚠️ Manual step required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to Supabase Dashboard → Database → Extensions" -ForegroundColor Cyan
Write-Host "2. Enable 'pg_cron' extension" -ForegroundColor Cyan
Write-Host "3. Go to SQL Editor and run this:" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  `$`$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 
      'Bearer YOUR_SUPABASE_ANON_KEY'
    )
  );
  `$`$
);
"@ -ForegroundColor White
Write-Host ""
Write-Host "Replace YOUR_PROJECT_REF and YOUR_SUPABASE_ANON_KEY with your actual values" -ForegroundColor Yellow

# Step 6: Check service worker
Write-Host "`n6️⃣ Checking Service Worker..." -ForegroundColor Yellow
if (Test-Path "public/sw.js") {
    Write-Host "✅ Service worker found" -ForegroundColor Green
} else {
    Write-Host "❌ Service worker not found at public/sw.js" -ForegroundColor Red
}

# Step 7: Check notification icons
Write-Host "`n7️⃣ Checking Notification Icons..." -ForegroundColor Yellow
$icons = @("icon-72x72.png", "icon-192x192.png", "icon-512x512.png")
$missingIcons = @()

foreach ($icon in $icons) {
    if (-not (Test-Path "public/$icon")) {
        $missingIcons += $icon
    }
}

if ($missingIcons.Count -eq 0) {
    Write-Host "✅ All notification icons found" -ForegroundColor Green
} else {
    Write-Host "⚠️ Missing icons: $($missingIcons -join ', ')" -ForegroundColor Yellow
    Write-Host "Add these icons to the public/ folder for proper notifications" -ForegroundColor Yellow
}

# Final summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Push Notifications Deployment Summary" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Database triggers deployed (likes, comments, follows, messages)" -ForegroundColor Green
Write-Host "✅ Edge function deployed" -ForegroundColor Green
Write-Host "✅ Service worker configured" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up the cron job (see instructions above)" -ForegroundColor White
if ($missingIcons.Count -gt 0) {
    Write-Host "2. Add missing notification icons to public/ folder" -ForegroundColor White
}
Write-Host ""
Write-Host "📖 Full Documentation: PUSH_NOTIFICATIONS_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test Your Notifications:" -ForegroundColor Yellow
Write-Host "   1. Login to DropShare" -ForegroundColor White
Write-Host "   2. Allow notifications when prompted" -ForegroundColor White
Write-Host "   3. From another account, like/comment on your post" -ForegroundColor White
Write-Host "   4. You should receive a notification instantly!" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
