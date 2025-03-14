const routeProtectionRules = {
  // Public routes - no auth needed
  public: ['/login', '/register', '/forgotPassword', '/resetPassword', '/about', '/contact'],

  // Admin routes - needs admin role
  admin: ['/admin', '/admin/users', '/admin/settings'],

  // API routes protection
  api: {
    public: ['/api/public', '/api/auth/login', '/api/auth/register'],
    protected: ['/api/users', '/api/posts'],
    admin: ['/api/admin']
  }
}; ;

function matchRoute(pathname: string, routes: string[]) {
  return routes.some((route) => {
    // Exact match
    if (route === pathname) return true;
    // Match routes with wildcard
    if (route.endsWith('*')) {
      const baseRoute = route.slice(0, -1);
      return pathname.startsWith(baseRoute);
    }
    return false;
  });
}

export { routeProtectionRules, matchRoute };