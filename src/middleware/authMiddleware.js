/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens from request headers
 * Use this to protect routes that require authentication
 */

import AuthService from '../services/authService.js';
import { User } from '../models/index.js';

/**
 * Verify JWT Token Middleware
 * 
 * Extracts and validates JWT token from Authorization header
 * If valid, adds user data to req.user for use in route handlers
 */
const authenticateToken = async (req, res, next) => {
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
  let decoded;
  try {
    decoded = AuthService.verifyToken(token);
  } catch (error) {
    // Token is invalid or expired
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }

  let user;
  try {
    user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'is_deleted', 'status']
    });
  } catch (error) {
    console.error('Authentication lookup failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication could not be verified'
    });
  }

  if (!user || user.is_deleted || user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'User account is inactive or deleted'
    });
  }

  req.user = { ...decoded, role: user.role };
  next();
};

export { authenticateToken };
