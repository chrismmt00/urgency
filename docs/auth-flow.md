# Authentication & Billing Overview

This project now supports a lightweight email/password login with verification, trials, and subscription gating.

## Environment

Set the following in `.env.local` (values already present in development example):

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- `TOKEN_EXPIRY_ACCESS` / `TOKEN_EXPIRY_REFRESH` *(optional overrides)*
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `MAIL_FROM`
- *(future)* `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Endpoints

| Route | Method | Purpose |
| ----- | ------ | ------- |
| `/api/auth/register` | `POST` | Create a user, start 3-day trial, send Brevo verification email |
| `/api/auth/login` | `POST` | Email/password login, issues session cookies |
| `/api/auth/logout` | `POST` | Revokes refresh token & clears cookies |
| `/api/auth/me` | `GET` | Resolve current user (auto refreshes session if needed) |
| `/api/auth/verify?token=…` | `GET` | Verifies email token, logs the user in |
| `/api/auth/refresh` | `POST` | Rotates access token using refresh cookie |
| `/api/auth/oauth/[provider]` | `GET` | Placeholder for Google/Outlook OAuth |
| `/api/billing/checkout` | `POST` | Placeholder endpoint for upcoming Stripe checkout |

## Database additions

Migration `002_auth_trial_subscription.sql` introduces:

- `trial_started_at`, `trial_ends_at`, `subscription_status`, `subscription_ends_at`, `provider` on `app_user`
- `email_verification_token` table for hashed verification tokens
- `login_session` table for refresh token management

Run `npm install` and then `npm run migrate` from the workspace root to bootstrap schema.

## Front-end flow

- `AuthProvider` fetches `/api/auth/me`, exposes helpers to open the auth modal, and manages `user`.
- `AuthModal` contains sign-in/sign-up forms plus OAuth buttons (stubs until providers integrate).
- Navigating to `/inbox` requires a verified account with an active trial/subscription; otherwise redirects to `/subscribe`.
- `/subscribe` promotes the plan, and `/verify` handles verification states.

## TODO

- Implement Google + Outlook OAuth flows and map provider ids to `connected_account`.
- Connect Stripe checkout to create subscriptions and update `subscription_status` / `subscription_ends_at`.
- Add password reset and resend verification endpoints.
- Expand test coverage (`app/api/auth/*.test.ts`) for happy/error paths.
