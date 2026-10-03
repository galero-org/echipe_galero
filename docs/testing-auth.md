# Authentication Test Setup

These tests use a dedicated Supabase project or a dedicated test user. Never use a production account, a real user's password, or a service-role key in source control.

## 1. Prepare Supabase

1. Open the Supabase Dashboard for the test project.
2. In **Authentication > Providers**, enable Email and Google.
3. In **Authentication > URL Configuration**, set:
   - Site URL: `http://127.0.0.1:4321`
   - Redirect URL: `http://127.0.0.1:4321/api/auth/callback`
4. In **Authentication > Users**, create a dedicated email/password user, for example `galero.e2e@example.com`.
5. Confirm that user manually if email confirmation is enabled.
6. Ensure the test project contains the application tables, policies, profile metadata/trigger, and the environment values used by the local app.

## 2. Configure local environment

The app still needs its normal local `.env` values, including `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `PUBLIC_SUPABASE_REDIRECT` set to `http://127.0.0.1:4321/api/auth/callback`.

Create a local ignored `.env.test` file from the example:

```powershell
Copy-Item .env.test.example .env.test
```

Edit `.env.test` with the test user's real credentials. Playwright loads this file automatically. Alternatively, set the same variables in the PowerShell session:

```powershell
$env:SUPABASE_TEST_EMAIL = "galero.e2e@example.com"
$env:SUPABASE_TEST_PASSWORD = "set-this-locally"
npm run test:integration
```

The integration suite logs in through the real `/signin` page, verifies the httpOnly auth cookies, reads `/api/get-profile`, opens a protected page, refreshes the session, and logs out. It does not create, update, or delete application records.

## 3. Google OAuth setup

1. Create a separate Google Cloud OAuth web client for the test environment.
2. In Google Cloud, configure the Supabase callback URL shown by the Supabase Google provider configuration, usually `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Copy the Google client ID and secret into the Supabase test project's Google provider settings.
4. Add the local application callback URL from step 1 to the Supabase allowed redirect URLs.
5. Create a dedicated Google test account with no production data and complete any required Google verification/MFA manually.

The credential-free smoke suite verifies that the Google button is correctly wired to `/api/auth/signin`. A full Google login is intentionally not run headlessly: Google may require CAPTCHA, MFA, device verification, or block automated browsers. Validate the final Google account creation/login once in a headed browser with the dedicated account, then keep that account available for manual release checks.

## 4. Test order

```powershell
npm run test:smoke
npm run test:integration
npm run build
```

If the integration command reports missing test credentials, that is an intentional fail-fast guard. Do not put credentials in `.env.test.example`, test files, CI logs, screenshots, or Playwright traces.
