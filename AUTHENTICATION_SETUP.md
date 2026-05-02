# User Authentication Implementation Guide

## Overview
This guide explains the new user sign-up and login system implemented in your matrimonial app.

---

## What Was Added

### 1. **New Dependencies**
- `bcryptjs` - For secure password hashing
- `jsonwebtoken` - For JWT token generation and verification
- `dotenv` - For environment variable management

### 2. **New Files**
- `.env` - Environment configuration
- `src/middleware/authMiddleware.js` - Authentication middleware for protecting routes
- `API_DOCUMENTATION.md` - Complete API documentation

### 3. **Updated Files**
- `package.json` - Added new dependencies
- `src/services/userService.js` - Added signUp and login logic with full comments
- `src/controllers/userController.js` - Added signUp and login endpoints with documentation
- `src/routes/userRoutes.js` - Added signUp and login routes

---

## Key Features

### ✅ Sign-Up Features
- Register with **email** OR **phone** (or both)
- Password hashing using bcryptjs (10 salt rounds)
- Input validation (email format, phone format, password length)
- Duplicate prevention (unique email and phone)
- Automatic JWT token generation
- User roles and status management

### ✅ Login Features
- Login with **email** OR **phone**
- Password verification using bcrypt
- Account status checking (active/inactive/blocked)
- JWT token generation for session management
- Error handling for invalid credentials

### ✅ Security Features
- Passwords are never stored in plain text (hashed with bcryptjs)
- JWT tokens expire after 7 days
- Authentication middleware for protecting routes
- Input validation to prevent invalid data
- Generic error messages to prevent information leakage

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file:
```env
# Server Configuration
PORT=3000

# JWT Configuration - CHANGE THIS IN PRODUCTION
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Environment
NODE_ENV=development
```

### 3. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## API Endpoints

### Authentication Endpoints

#### 1. Sign-Up
```
POST /api/users/signup
```

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "9876543210",
    "role": "user",
    "status": "active",
    "created_at": "2024-05-02T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 2. Login
```
POST /api/users/login
```

**Request:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "9876543210",
    "role": "user",
    "status": "active",
    "is_verified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Using Protected Routes

To protect a route, use the authentication middleware:

```javascript
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'User profile retrieved',
    user: req.user // Contains: id, email, phone, role
  });
});

export default router;
```

**Request with Token:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Testing with cURL

### Test Sign-Up
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Test Login with Email
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "Password123"
  }'
```

### Test Login with Phone
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "9876543210",
    "password": "Password123"
  }'
```

---

## Database Schema

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active'
);
```

---

## Code Architecture

### Service Layer (`userService.js`)
- Handles all business logic
- Password hashing and verification
- JWT token generation and verification
- Input validation

### Controller Layer (`userController.js`)
- Handles HTTP requests/responses
- Calls appropriate service methods
- Returns formatted JSON responses

### Routes Layer (`userRoutes.js`)
- Maps endpoints to controllers
- Defines route paths

### Middleware Layer (`authMiddleware.js`)
- Verifies JWT tokens
- Protects routes

---

## Validation Rules

### Sign-Up Validation
- ✅ At least email OR phone required
- ✅ Email format validation
- ✅ Phone format validation (10+ digits)
- ✅ Password minimum 6 characters
- ✅ Unique email (no duplicates)
- ✅ Unique phone (no duplicates)

### Login Validation
- ✅ EmailOrPhone is required
- ✅ Password is required
- ✅ Account status check (active/inactive/blocked)

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Either email or phone required" | No email or phone provided | Provide at least one |
| "Invalid email format" | Email format incorrect | Use valid email format |
| "Invalid phone number format" | Phone has less than 10 digits | Use valid phone number |
| "Password must be at least 6 characters" | Password too short | Use minimum 6 characters |
| "Email already registered" | Email exists in database | Use different email |
| "Phone already registered" | Phone exists in database | Use different phone |
| "Invalid email/phone or password" | Wrong credentials | Check email/phone and password |
| "Your account has been blocked" | Account status is blocked | Contact admin |

---

## Security Best Practices

1. **Change JWT Secret** - Update `JWT_SECRET` in `.env` for production
2. **Use HTTPS** - Always use HTTPS in production
3. **Validate Inputs** - All inputs are validated
4. **Strong Passwords** - Enforce strong password policies
5. **Token Expiration** - Tokens expire after 7 days
6. **No Password Logs** - Passwords are never logged

---

## Next Steps

### To Add Database Support:
1. Install database driver (e.g., mysql2)
2. Update `UserService` methods to query database
3. Replace mock `users` array with database queries

### To Add Email Verification:
1. Install nodemailer
2. Add email sending logic
3. Update `is_verified` field after verification

### To Add Password Reset:
1. Add forgot-password endpoint
2. Generate reset tokens
3. Add reset-password endpoint

---

## File Structure
```
matrimonial_app/
├── .env
├── package.json
├── src/
│   ├── index.js
│   ├── controllers/
│   │   └── userController.js (updated - added signUp & login)
│   ├── middleware/
│   │   ├── requestLogger.js
│   │   └── authMiddleware.js (new)
│   ├── routes/
│   │   └── userRoutes.js (updated)
│   └── services/
│       └── userService.js (updated - added signUp & login logic)
└── API_DOCUMENTATION.md (new)
```

---

## Troubleshooting

### Issue: "JWT secret is undefined"
**Solution:** Make sure `.env` file exists and `JWT_SECRET` is set

### Issue: "Module not found bcryptjs"
**Solution:** Run `npm install` to install dependencies

### Issue: "Port 3000 already in use"
**Solution:** Change PORT in `.env` or kill the process using port 3000

### Issue: "Token expired"
**Solution:** Token expires after 7 days, user needs to login again

---

## Support & Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

For questions or issues, refer to the comments in the source code files.

---

**Happy coding! 🚀**
