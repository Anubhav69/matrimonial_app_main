import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateSignUpData, validateLoginData, validatePassword } from '../validators/authValidator.js';
import { User } from '../models/index.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

  static async requestPasswordReset(identifier) {
    const where = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where: { ...where, is_deleted: false } });
    // Do not reveal whether an account exists.
    if (!user || !user.email) return { success: true, message: 'If the account exists, a reset email has been sent' };
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    await user.update({ reset_password_otp_hash: otpHash, reset_password_otp_expires: new Date(Date.now() + 10 * 60 * 1000), reset_password_token: null, reset_password_expires: null });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `${process.env.SMTP_FROM_NAME || 'Soul Match'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Your SoulMatch password reset OTP',
      text: `Your SoulMatch password reset OTP is ${otp}. It expires in 10 minutes.`
    });
    return { success: true, message: 'If the account exists, a reset email has been sent' };
  }

  static async verifyPasswordResetOtp(identifier, otp) {
    const where = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where: { ...where, is_deleted: false } });
    if (!user || !user.reset_password_otp_hash || !user.reset_password_otp_expires || user.reset_password_otp_expires < new Date()) throw new Error('OTP is invalid or expired');
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (hash !== user.reset_password_otp_hash) throw new Error('Invalid OTP');
    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({ reset_password_token: resetToken, reset_password_expires: new Date(Date.now() + 10 * 60 * 1000), reset_password_otp_hash: null, reset_password_otp_expires: null });
    return { success: true, resetToken };
  }

  static async resetPassword(token, password, confirmPassword) {
    validatePassword(password);
    if (password !== confirmPassword) throw new Error('Passwords do not match');
    const user = await User.findOne({ where: { reset_password_token: token, is_deleted: false } });
    if (!user || !user.reset_password_expires || user.reset_password_expires < new Date()) throw new Error('Reset link is invalid or expired');
    await user.update({ password_hash: await bcryptjs.hash(password, 10), reset_password_token: null, reset_password_expires: null, reset_password_otp_hash: null, reset_password_otp_expires: null });
    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Generate JWT Token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
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
