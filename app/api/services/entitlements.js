import Integrator from '../models/integrator';
import Project from '../models/project';
import User from '../models/user';
import EntitlementUsage from '../models/entitlementUsage';
import { getPlanByAnyPriceId, getPlanByName } from '../constants/plans';
import { isSubscriptionStatusActive } from '../utils/stripe-status-mapper';

const ACTIVE_PROJECT_STATUSES = ['Pending', 'Progress'];
const BILLABLE_MEMBER_ROLES = ['integrator', 'manager', 'engineer'];

const entitlementError = (message, details = {}, statusCode = 403) =>
  Object.assign(new Error(message), { statusCode, code: details.code || 'PLAN_LIMIT_REACHED', details });

const resolvePlan = (integrator) =>
  getPlanByAnyPriceId(integrator?.priceId) || getPlanByName(integrator?.plan);

const billingPeriod = (integrator) => {
  const now = new Date();
  const storedStart = integrator?.startDate ? new Date(integrator.startDate) : null;
  const storedEnd = integrator?.endDate ? new Date(integrator.endDate) : null;
  if (storedStart && storedEnd && !Number.isNaN(storedStart.getTime()) && !Number.isNaN(storedEnd.getTime()) && now < storedEnd) {
    return { start: storedStart, end: storedEnd };
  }
  return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) };
};

export async function getOrganisationEntitlements(integratorId, { requireActive = true } = {}) {
  const integrator = await Integrator.findById(integratorId).select('status plan priceId startDate endDate').lean();
  if (!integrator) throw entitlementError('Organisation not found', { code: 'ORGANISATION_NOT_FOUND' }, 404);
  if (requireActive && !isSubscriptionStatusActive(integrator.status)) {
    throw entitlementError('An active subscription is required', { code: 'SUBSCRIPTION_INACTIVE', subscriptionStatus: integrator.status }, 403);
  }
  const plan = resolvePlan(integrator);
  if (!plan) throw entitlementError('The subscription plan is not recognised', { code: 'UNKNOWN_PLAN' }, 409);
  return { integrator, plan, limits: plan.limits, period: billingPeriod(integrator) };
}

async function ensureUsage(integratorId, period) {
  const [activeProjects, activeMembers] = await Promise.all([
    Project.countDocuments({ integrator: integratorId, status: { $in: ACTIVE_PROJECT_STATUSES } }),
    User.countDocuments({ integrator: integratorId, role: { $in: BILLABLE_MEMBER_ROLES }, user_status: true })
  ]);
  try {
    await EntitlementUsage.updateOne(
      { integrator: integratorId },
      { $setOnInsert: { activeProjects, activeMembers, documentPeriodStart: period.start, documentPeriodEnd: period.end, documentUploads: 0 } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  await EntitlementUsage.updateOne(
    { integrator: integratorId, $or: [{ documentPeriodEnd: { $lte: new Date() } }, { documentPeriodStart: { $ne: period.start } }] },
    { $set: { documentPeriodStart: period.start, documentPeriodEnd: period.end, documentUploads: 0 } }
  );
}

export async function reserveEntitlement(integratorId, resource) {
  const { plan, limits, period } = await getOrganisationEntitlements(integratorId);
  await ensureUsage(integratorId, period);
  const limit = limits[resource];
  if (!Number.isInteger(limit)) throw entitlementError('Unknown plan entitlement', { code: 'UNKNOWN_ENTITLEMENT', resource }, 500);
  const usageField = resource === 'monthlyDocumentUploads' ? 'documentUploads' : resource;
  const usage = await EntitlementUsage.findOneAndUpdate(
    { integrator: integratorId, [usageField]: { $lt: limit } },
    { $inc: { [usageField]: 1 } },
    { new: true }
  ).lean();
  if (!usage) {
    const current = (await EntitlementUsage.findOne({ integrator: integratorId }).lean())?.[usageField] ?? limit;
    throw entitlementError(`Your ${plan.name} limit has been reached`, { resource, current, limit, plan: plan.key });
  }
  return { plan, limit, current: usage[usageField], period };
}

export async function releaseEntitlement(integratorId, resource) {
  const usageField = resource === 'monthlyDocumentUploads' ? 'documentUploads' : resource;
  await EntitlementUsage.updateOne(
    { integrator: integratorId, [usageField]: { $gt: 0 } },
    { $inc: { [usageField]: -1 } }
  );
}

export async function assertDocumentFileSize(integratorId, bytes) {
  const { plan, limits } = await getOrganisationEntitlements(integratorId);
  const maximumBytes = limits.maximumFileSizeMb * 1024 * 1024;
  if (bytes > maximumBytes) {
    throw entitlementError(`Files on ${plan.name} must be ${limits.maximumFileSizeMb}MB or smaller`, {
      resource: 'maximumFileSizeMb', limit: limits.maximumFileSizeMb, current: Math.ceil(bytes / 1024 / 1024), plan: plan.key
    }, 413);
  }
  return { plan, maximumBytes };
}

export async function getEntitlementUsage(integratorId) {
  const { plan, limits, period } = await getOrganisationEntitlements(integratorId, { requireActive: false });
  await ensureUsage(integratorId, period);
  const usage = await EntitlementUsage.findOne({ integrator: integratorId }).lean();
  return {
    plan: { key: plan.key, name: plan.name }, limits,
    usage: { activeProjects: usage.activeProjects, activeMembers: usage.activeMembers, monthlyDocumentUploads: usage.documentUploads },
    documentPeriodStart: usage.documentPeriodStart,
    documentPeriodEnd: usage.documentPeriodEnd
  };
}

export const isActiveProjectStatus = (status) => ACTIVE_PROJECT_STATUSES.includes(status);
export const isBillableMember = (user) => BILLABLE_MEMBER_ROLES.includes(user?.role) && user?.user_status === true;
