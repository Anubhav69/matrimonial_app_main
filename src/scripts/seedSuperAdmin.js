/**
 * Seed Super Admin Script
 * 
 * Usage:
 *   node src/scripts/seedSuperAdmin.js --email admin@example.com --password YourSecurePassword123
 *   node src/scripts/seedSuperAdmin.js --phone 9876543210 --password YourSecurePassword123
 *   node src/scripts/seedSuperAdmin.js --email admin@example.com --phone 9876543210 --password YourSecurePassword123
 * 
 * This creates a super_admin user directly in the database.
 * Run this ONCE during initial setup.
 */

import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import { connectDB, User } from '../models/index.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      params[key] = value;
    }
  }

  return params;
};

const seedSuperAdmin = async () => {
  const params = parseArgs();

  if (!params.password) {
    console.error('❌ Error: --password is required');
    console.log('\nUsage:');
    console.log('  node src/scripts/seedSuperAdmin.js --email admin@example.com --password YourPassword123');
    console.log('  node src/scripts/seedSuperAdmin.js --phone 9876543210 --password YourPassword123');
    process.exit(1);
  }

  if (!params.email && !params.phone) {
    console.error('❌ Error: Either --email or --phone is required');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('✅ Database connected');

    // Check if super_admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { role: 'super_admin', is_deleted: false }
    });

    if (existingSuperAdmin) {
      console.log('⚠️  A super admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Phone: ${existingSuperAdmin.phone}`);
      console.log('\nIf you want to create another one, delete the existing one first.');
      process.exit(0);
    }

    // Check for duplicate email/phone
    if (params.email) {
      const existingEmail = await User.findOne({ where: { email: params.email, is_deleted: false } });
      if (existingEmail) {
        console.error(`❌ Email "${params.email}" is already registered`);
        process.exit(1);
      }
    }

    if (params.phone) {
      const existingPhone = await User.findOne({ where: { phone: params.phone, is_deleted: false } });
      if (existingPhone) {
        console.error(`❌ Phone "${params.phone}" is already registered`);
        process.exit(1);
      }
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcryptjs.hash(params.password, saltRounds);

    // Create super admin
    const superAdmin = await User.create({
      email: params.email || null,
      phone: params.phone || null,
      password_hash,
      role: 'super_admin',
      is_deleted: false,
      is_verified: true,
      status: 'active'
    });

    console.log('\n🎉 Super Admin created successfully!');
    console.log('─'.repeat(40));
    console.log(`   ID:    ${superAdmin.id}`);
    console.log(`   Email: ${superAdmin.email || 'N/A'}`);
    console.log(`   Phone: ${superAdmin.phone || 'N/A'}`);
    console.log(`   Role:  ${superAdmin.role}`);
    console.log('─'.repeat(40));
    console.log('\nYou can now log in with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed super admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();

