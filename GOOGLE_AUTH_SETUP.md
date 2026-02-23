# Google Authentication Fix Instructions

The "Access blocked: This app's request is invalid" (Error 400: redirect_uri_mismatch) occurs because Google does not recognize the **Redirect URI** that Supabase is sending.

Because you are using Supabase for Auth, you must whitelist the **Supabase Callback URL**, not just localhost.

## Step 1: Configure Google Cloud Console

1.  Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2.  Find your **OAuth 2.0 Client ID** (the one you created for this project) and click the **Pencil (Edit)** icon.
3.  Scroll down to **Authorized redirect URIs**.
4.  Click **ADD URI**.
5.  Paste this **EXACT** URL:
    ```
    https://jfdvbyoyvqriqhqtmyjo.supabase.co/auth/v1/callback
    ```
6.  Click **Save**.

> **Note:** It may take 5 minutes for Google to update the settings.

## Step 2: Configure Supabase Dashboard

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/jfdvbyoyvqriqhqtmyjo).
2.  Navigate to **Authentication** > **URL Configuration**.
3.  Ensure **Site URL** is set to:
    ```
    http://localhost:3000
    ```
4.  In **Redirect URLs**, standard `http://localhost:3000/**` should be present (or add `http://localhost:3000`).
5.  Click **Save**.

## Step 3: Test

1.  Restart your app if needed (`npm run dev`).
2.  Ensure you are on `http://localhost:3000`.
3.  Click **Sign In** -> **Google**.
