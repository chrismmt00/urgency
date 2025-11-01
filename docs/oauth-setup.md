# Google OAuth & Sign-In Setup (Development)

Add these to your .env.local:

- GOOGLE_CLIENT_ID=your-google-client-id
- GOOGLE_CLIENT_SECRET=your-google-client-secret
- GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback # override if dev runs on another port
- ENCRYPTION_KEY=<32-byte hex string> # e.g., output of `openssl rand -hex 32`
- OAUTH_STATE_SECRET=<random secret for state HMAC, optional; falls back to JWT_ACCESS_SECRET>

Optional (Stripe placeholders):

- STRIPE_SECRET_KEY=
- STRIPE_WEBHOOK_SECRET=
- STRIPE_PRICE_ID=
- STRIPE_BILLING_PORTAL_URL=

Notes:

- If your Next dev server uses a different port (e.g., 3001), set GOOGLE_REDIRECT_URI accordingly.
- In Google Cloud Console, add the redirect URI to the OAuth client and enable the Gmail API.
- We request scopes: `openid email profile https://www.googleapis.com/auth/gmail.readonly`.

## Flow

- GET /api/auth/oauth/google?intent=connect → verifies session, sets signed state cookies with `intent=connect`, redirects to Google.
- GET /api/auth/oauth/google?intent=login → allows signed-out users, sets intent=login in the state, redirects to Google.
- GET /api/auth/oauth/google/callback → validates state, exchanges code, and then:
  - if intent=login: find or create user by profile email, mark verified and start trial if new, create session and set auth cookies, and redirect to /inbox
  - if intent=connect: attach Gmail account to existing session and redirect to /settings?tab=accounts
- GET /api/mail/messages → uses the stored tokens (refreshes when needed) to fetch the latest inbox messages.

## Database

- Tokens are encrypted with AES-256-GCM and stored in `connected_account` as BYTEA.

## Tester setup

- In Google Cloud Console → OAuth consent screen: add test users (their Gmail addresses) to be able to consent in testing mode.
- Ensure the "Gmail API" is enabled for your project.

## Billing fields

The migration `003_billing_metadata.sql` adds these fields to `app_user`:

- stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_renewal_at

It also creates a `billing_event` table for audit logs.
