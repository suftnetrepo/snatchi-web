import Integrator from '../models/integrator';

const ACCESS_STATUSES = new Set(['active', 'trialing']);

export function subscriptionStatusAllowsWorkspaceAccess(status) {
  return ACCESS_STATUSES.has(String(status || '').trim().toLowerCase());
}

export async function organisationHasWorkspaceAccess(integratorId) {
  if (!integratorId) return false;

  const organisation = await Integrator.findById(integratorId).select('status').lean();
  return Boolean(organisation && subscriptionStatusAllowsWorkspaceAccess(organisation.status));
}

export { ACCESS_STATUSES };
