# Snatchi

Snatchi is an AV project, engineer and booking management platform owned and operated by PlasmaPro Ltd and developed by Suftnet.

## Local development

The project requires Node.js 22.13 or later and uses Yarn Classic.

```bash
yarn install
yarn dev
```

Create production assets with:

```bash
yarn build
yarn start
```

Application secrets and database credentials must be supplied through the deployment environment. Do not commit `.env` files or credentials.

## Platform administrator accounts

Platform administrator accounts are control-plane identities. They are completely separate from the customer account lifecycle.

An administrator account must not:

- be created through public registration or organisation onboarding;
- start a trial or create a Stripe customer or subscription;
- represent a customer organisation owner, manager, engineer or guest;
- consume an organisation member allowance;
- inherit plan entitlements or lose access when a customer subscription changes;
- be used for normal project, scheduling, invoicing or engineer activity.

Administrators use the protected `/protected/admin/*` area exclusively for platform operations. Access is enforced by the `admin` role in middleware, the server-side admin layout and admin API handlers. Hiding admin navigation is not an authorization control.

Administrator records do not have an `integrator` reference. The user schema requires an organisation only for non-admin roles, and authentication safely represents an administrator's organisation as `null`. Provisioning an administrator therefore does not create or modify an organisation, subscription, trial, billing record or entitlement record.

### Provisioning rules

Administrators must be created only with `scripts/provisionAdmin.js`. The script:

- requires an explicit test or live target;
- performs a dry run unless `--apply` is provided;
- requires an additional confirmation for live writes;
- removes any legacy organisation reference from the administrator record;
- hashes passwords with bcrypt;
- creates or updates only the specified email address;
- never uses the application's ordinary `MONGODB_URL` implicitly.

### Provision a test administrator

Configure a dedicated test connection:

```bash
export MONGODB_TEST_URL='your-test-mongodb-url'
```

Set the administrator details. Enter the password through a hidden prompt so it is not placed directly in shell history:

```bash
export ADMIN_EMAIL='admin@plasmapro.co.uk'
export ADMIN_FIRST_NAME='Platform'
export ADMIN_LAST_NAME='Administrator'
export ADMIN_MOBILE=''

read -s "ADMIN_PASSWORD?Admin password: "
export ADMIN_PASSWORD
```

Passwords must contain between 12 and 72 characters.

Run a dry run first:

```bash
yarn admin:provision -- --target=test
```

After checking the displayed target, database and email, apply the change:

```bash
yarn admin:provision -- --target=test --apply
```

Sign in and verify the administrator can access `/protected/admin/dashboard` but is not represented in customer subscription, trial, member-usage or entitlement data.

### Provision a live administrator

Test the account and admin workflows against the test database before touching production. Then configure the live connection separately:

```bash
export MONGODB_LIVE_URL='your-live-mongodb-url'
```

Run the live dry run:

```bash
yarn admin:provision -- --target=live
```

Apply only after verifying every displayed value:

```bash
yarn admin:provision -- \
  --target=live \
  --apply \
  --confirm-live=PROVISION_ADMIN
```

### Removing access

Do not delete customer organisations, subscriptions or billing records when removing administrator access. Disable or remove only the administrator identity. Rotate the administrator password immediately if credentials may have been exposed, and invalidate active sessions where supported.

## Required production checks

Before deployment:

- run `yarn build`;
- verify admin access with an administrator and a non-administrator test account;
- verify unauthenticated admin APIs return `401` and non-admin accounts receive `403`;
- verify the administrator does not appear in plan usage or member-limit calculations;
- confirm Stripe live price IDs and production environment variables are configured;
- review dependency audit findings and deployment monitoring.

## Admin go-live controls

The first production admin release deliberately focuses on safe, supportable controls. MFA and advanced session management remain a separate security milestone and must not be represented as complete.

Available now:

- global, paginated organisation and user visibility;
- reversible organisation suspension and restoration from the organisation detail panel;
- suspension without changing or cancelling the Stripe subscription;
- payment-failure investigation with Stripe reference and reconciliation data;
- idempotent transfer retry protection, including a five-minute concurrency lock;
- a mandatory operational reason for organisation access changes and transfer retries;
- persistent administrator audit records containing actor, action, target, reason, result, time, IP address and user agent;
- read-only production integration health at `GET /api/admin/health` without returning credentials;
- paginated audit data at `GET /api/admin/audit`.

Customer-user access is read-only for platform administrators in this release. Permanent deletion and unaudited profile edits are intentionally blocked; customer organisation owners and managers retain their normal in-organisation controls.

Organisation suspension is an application-access control. It is intentionally independent of billing so an operator cannot accidentally cancel a live Stripe subscription while handling a support or risk incident. Restore returns the organisation to its recorded previous status.

### Operational procedure

Before an administrator changes access or retries a transfer:

1. Confirm the customer or payment identity using at least two independent references.
2. Investigate the current application and Stripe state.
3. Enter a concise reason describing the incident or support request; never include passwords, full card details or secrets.
4. Apply the smallest reversible action available.
5. Confirm the result and review the corresponding `/api/admin/audit` record.

For transfer retries, the server validates that the payment succeeded, a charge exists, the destination account can receive payouts and no completed transfer exists. Stripe receives a deterministic idempotency key, while MongoDB prevents concurrent retries. A failure clears the temporary lock and is also audited.

### Deployment verification

After deployment, verify with production-safe test records that:

- an unauthenticated request to each `/api/admin/*` endpoint returns `401`;
- a signed-in non-admin request returns `403`;
- suspending an organisation blocks its application lifecycle access but leaves Stripe unchanged;
- restoring an organisation recovers its previous application status;
- duplicate transfer retry requests create no more than one Stripe transfer;
- every privileged mutation produces an administrator audit record;
- `/api/admin/health` reports only configuration state and never secret values.

Do not use webhook replay casually in production. It remains a recovery tool and should receive the same mandatory-reason and complete audit treatment before being exposed as a routine dashboard action.

## Dependency security status

The August 2026 dependency remediation removed all known critical advisories reported by Yarn Classic and upgraded direct runtime dependencies to patched releases. The production build and focused admin access-control checks must pass before deployment.

The registry may continue to report duplicated high-severity findings in transitive tooling shipped by current upstream releases, particularly MJML CLI, Firebase Admin, Sentry and Bunyan dependency trees. These are not treated as silently resolved: review them during every release, upgrade when upstream publishes compatible fixes, and do not expose package CLIs or user-controlled glob/template input in production. Run:

```bash
yarn audit --groups dependencies
yarn test:e2e:admin-access
yarn build
```
