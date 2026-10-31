/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Provides role-checking middleware for protecting admin routes.
 * Must be used AFTER authenticateToken middleware.
 */

/**
 * Require one of the specified roles to access the route.
 * Usage: requireRole('admin', 'super_admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No user data found in request'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Shorthand: require admin or super_admin
 */
const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Shorthand: require super_admin only
 */
const requireSuperAdmin = requireRole('super_admin');

export { requireRole, requireAdmin, requireSuperAdmin };

