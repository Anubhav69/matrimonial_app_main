import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateSignUpData, validateLoginData } from '../validators/authValidator.js';
import { User } from '../models/index.js';

/**
 * AuthService - Handles authentication logic
 */
class AuthService {
  static JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

  /**
   * User Sign-Up - Creates new user account
   */
  static async signUp(signUpData) {
    const { email, phone, password } = signUpData;

    validateSignUpData(signUpData);

    if (email) {
      const existingUser = await User.findOne({ where: { email, is_deleted: false } });
      if (existingUser) {
        throw new Error('Email already registered');
      }
    }

    if (phone) {
      const existingUser = await User.findOne({ where: { phone, is_deleted: false } });
      if (existingUser) {
        throw new Error('Phone number already registered');
      }
    }

    const saltRounds = 10;
    const password_hash = await bcryptjs.hash(password, saltRounds);

    const newUser = await User.create({
      email: email || null,
      phone: phone || null,
      password_hash,
      role: 'user',
      is_deleted: false,
      is_verified: false,
      status: 'active'
    });

    const token = this.generateToken(newUser);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.created_at
      },
      token
    };
  }

  /**
   * User Login - Authenticates user credentials
   */
  static async login(loginData) {
    const { emailOrPhone, password } = loginData;

    validateLoginData(loginData);

    let user;

    if (emailOrPhone.includes('@')) {
      user = await User.findOne({ where: { email: emailOrPhone, is_deleted: false } });
    } else {
      user = await User.findOne({ where: { phone: emailOrPhone, is_deleted: false } });
    }

    if (!user) {
      throw new Error('Invalid email/phone or password');
    }

    if (user.status === 'blocked') {
      throw new Error('Your account has been blocked');
    }

    if (user.status === 'inactive') {
      throw new Error('Your account is inactive');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email/phone or password');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified
      },
      token
    };
  }

  /**
   * Generate JWT Token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '7d'
    });

    return token;
  }

  /**
   * Verify JWT Token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export default AuthService;
