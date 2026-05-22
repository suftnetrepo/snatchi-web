# Stripe Connect Recipient ToS Fix Report

## Root Cause

Stripe Connect onboarding failed because the Express account creation request explicitly set:

```js
tos_acceptance: {
  service_agreement: 'recipient'
}
```

That agreement is not supported for a GB platform creating GB connected accounts. For this hosted Stripe Express onboarding flow, Stripe should use its default supported agreement instead of forcing `recipient`.

## Files Changed

- `app/api/services/stripeConnectService.js`
- `app/api/stripe/integrator/create-onboarding-link/route.js`

## Removed Stripe Parameter

- Removed `tos_acceptance.service_agreement = 'recipient'`

## Before Account Creation Code

```js
const account = await stripe.accounts.create({
  type: 'express',
  country: integrator.address?.country_code || 'GB',
  email: integrator.email,
  capabilities: {
    transfers: { requested: true },
    card_payments: { requested: true }
  },
  business_profile: {
    name: integrator.name,
    support_phone: integrator.mobile,
    support_email: integrator.email,
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://snatchi.app'
  },
  tos_acceptance: {
    service_agreement: 'recipient'
  }
});
```

## After Account Creation Code

```js
const account = await stripe.accounts.create({
  type: 'express',
  country: integrator.country || integrator.address?.country_code || 'GB',
  email: integrator.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true }
  },
  business_type: 'company',
  business_profile: {
    name: integrator.name,
    product_description: 'Engineer service marketplace payments'
  },
  metadata: {
    integratorId: integrator._id.toString(),
    platform: 'snatchi'
  }
});
```

## Error Handling Change

If Stripe account creation fails, the onboarding route now returns JSON with a readable structure:

```json
{
  "success": false,
  "error": "Stripe Connect account creation failed",
  "details": "Readable Stripe error message"
}
```

## Audit Result

- Stripe Connect `service_agreement` / `tos_acceptance` recipient usage was removed from `app/api/services/stripeConnectService.js`.
- Other `recipient` search hits in the codebase were unrelated to Stripe ToS configuration.

## Test Result

### Static validation

- `app/api/services/stripeConnectService.js`: no static errors reported
- `app/api/stripe/integrator/create-onboarding-link/route.js`: no static errors reported

### Runtime retest

Not completed in this shell. I could not restart Next.js or execute the live onboarding request here because the provided shell environment does not expose working runtime binaries for `node`, `npm`, or `curl`.

## Expected Retest Outcome

- Restart Next.js
- Open Settings -> Receive Payments
- Click Set Up Now
- Stripe-hosted onboarding URL should open
- Connected account should appear in Stripe Dashboard -> Connect -> Connected accounts

## Scope

- No changes were made to the payment transfer model.
- No changes were made to dashboard stats.
- Only Connect account creation and its error handling were updated.