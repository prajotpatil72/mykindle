import { verifyAccessToken } from '../utils/jwt.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, no token',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, no token',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Add user to request object
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Not authorized, invalid token',
    });
  }
};