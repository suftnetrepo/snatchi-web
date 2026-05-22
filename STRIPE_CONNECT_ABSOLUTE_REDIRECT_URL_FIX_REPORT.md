# Stripe Connect Absolute Redirect URL Fix Report

## Root Cause

Stripe Connect onboarding failed because `stripe.accountLinks.create()` was building `refresh_url` and `return_url` from `NEXT_PUBLIC_APP_URL` directly. If that environment variable was missing, malformed, or contained a leading space, Stripe received redirect URLs that did not start with `http://` or `https://`.

## Files Changed

- `app/api/services/stripeConnectService.js`
- `.env.local`

## Env Variables Required

Local development:

```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Before Redirect URLs

```js
refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?refresh=true`,
return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?connected=true`
```

## After Redirect URLs

```js
const baseUrl = (
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
).trim().replace(/\/+$/, '');

if (!/^https?:\/\//.test(baseUrl)) {
  throw new Error('Invalid app base URL. NEXTAUTH_URL or NEXT_PUBLIC_APP_URL must start with http:// or https://');
}

const refreshUrl = `${baseUrl}/protected/integrator/settings?tab=receive-payments&connect=refresh`;
const returnUrl = `${baseUrl}/protected/integrator/settings?tab=receive-payments&connect=return`;
```

Used in Stripe account-link creation:

```js
const accountLink = await stripe.accountLinks.create({
  account: stripeAccountId,
  refresh_url: refreshUrl,
  return_url: returnUrl,
  type: 'account_onboarding'
});
```

## Safety Check Added

If the resolved base URL does not start with `http://` or `https://`, the helper now throws a clear configuration error before calling Stripe.

## Test Result

### Static validation

- `app/api/services/stripeConnectService.js`: no static errors reported
- `.env.local`: no static errors reported

### Runtime retest

Not completed in this shell. I could not restart Next.js or issue the onboarding request from this environment because the runtime binaries are not available here.

## Expected Retest Outcome

- Restart Next.js
- Open Settings -> Receive Payments
- Click Set Up Now
- Stripe-hosted onboarding should open successfully

## Scope

- No Stripe payment architecture changes
- Only Connect onboarding redirect URL construction was updated