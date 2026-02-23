@echo off
echo Deploying PayMongo Edge Function Updates...
echo.

echo Step 1: Deploying create-checkout function...
supabase functions deploy create-checkout

echo.
echo Step 2: Verifying deployment...
supabase functions list

echo.
echo ✅ Deployment complete!
echo Now test the checkout flow at http://localhost:3000
pause
