/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens from request headers
 * Use this to protect routes that require authentication
 */

import UserService from '../services/userService.js';

/**
 * Verify JWT Token Middleware
 * 
 * Extracts and validates JWT token from Authorization header
 * If valid, adds user data to req.user for use in route handlers
 */
const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header
  // Expected format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer "

  // If no token is provided, return unauthorized error
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      error: 'No token provided'
    });
  }

  // Verify the token
  try {
    // Use UserService to verify token and get decoded payload
    const decoded = UserService.verifyToken(token);
    
    // Attach decoded user data to request object
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Token is invalid or expired
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

export { authenticateToken };
