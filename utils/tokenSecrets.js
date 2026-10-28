const requireSecret = (primaryName, legacyName) => {
  const value = process.env[primaryName] || process.env[legacyName];
  if (!value) {
    throw new Error(`${primaryName} is required`);
  }
  return value;
};

// Legacy NEXT_PUBLIC_* names remain supported so existing Render deployments
// continue working while the values are migrated to server-only variables.
export const getAccessTokenSecret = () =>
  requireSecret('ACCESS_TOKEN_SECRET', 'NEXT_PUBLIC_ACCESS_TOKEN_SECRET');

export const getRefreshTokenSecret = () =>
  requireSecret('REFRESH_TOKEN_SECRET', 'NEXT_PUBLIC_REFRESH_TOKEN_SECRET');
