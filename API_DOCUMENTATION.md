# API Documentation - User Authentication

## Overview
This document provides comprehensive API documentation for the user authentication system including sign-up and login endpoints.

---

## Table of Contents
1. [Sign-Up](#sign-up)
2. [Login](#login)
3. [Protected Routes](#protected-routes)
4. [Error Responses](#error-responses)
5. [Database Schema](#database-schema)

---

## Sign-Up

### Endpoint
```
POST /api/users/signup
```

### Description
Register a new user account with email or phone number and password.

### Request Body
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "securePassword123"
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | No* | User email address (must be unique) |
| phone | string | No* | User phone number (must be unique) |
| password | string | Yes | User password (minimum 6 characters) |

*At least one of email or phone is required.

### Success Response (201 Created)
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

### Error Responses

#### 400 Bad Request - Invalid Input
```json
{
  "success": false,
  "message": "Sign-up failed",
  "error": "Either email or phone number must be provided"
}
```

#### 400 Bad Request - Password Too Short
```json
{
  "success": false,
  "message": "Sign-up failed",
  "error": "Password must be at least 6 characters long"
}
```

#### 400 Bad Request - Invalid Email Format
```json
{
  "success": false,
  "message": "Sign-up failed",
  "error": "Invalid email format"
}
```

#### 409 Conflict - User Already Exists
```json
{
  "success": false,
  "message": "Sign-up failed",
  "error": "Email already registered"
}
```

### Examples

#### Example 1: Sign-up with Email
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "MySecurePass123"
  }'
```

#### Example 2: Sign-up with Phone
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "MySecurePass123"
  }'
```

#### Example 3: Sign-up with Both Email and Phone
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "password": "MySecurePass123"
  }'
```

---

## Login

### Endpoint
```
POST /api/users/login
```

### Description
Authenticate a user and receive a JWT token for authenticated requests.

### Request Body
```json
{
  "emailOrPhone": "user@example.com",
  "password": "securePassword123"
}
```

OR

```json
{
  "emailOrPhone": "9876543210",
  "password": "securePassword123"
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| emailOrPhone | string | Yes | User email or phone number |
| password | string | Yes | User password |

### Success Response (200 OK)
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

### Error Responses

#### 401 Unauthorized - Invalid Credentials
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Invalid email/phone or password"
}
```

#### 401 Unauthorized - Account Blocked
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Your account has been blocked"
}
```

#### 401 Unauthorized - Account Inactive
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Your account is inactive"
}
```

#### 400 Bad Request - Missing Fields
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Email/Phone and password are required"
}
```

### Examples

#### Example 1: Login with Email
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john.doe@example.com",
    "password": "MySecurePass123"
  }'
```

#### Example 2: Login with Phone
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "9876543210",
    "password": "MySecurePass123"
  }'
```

---

## Protected Routes

### How to Use Authentication

Once a user is logged in, they receive a JWT token. Use this token to access protected endpoints.

### Headers
Include the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Example Protected Route Request
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Authentication Middleware Usage

In your route files, import and use the authentication middleware:

```javascript
import { authenticateToken } from '../middleware/authMiddleware.js';

// Protected route - requires valid token
router.get('/profile', authenticateToken, (req, res) => {
  // req.user contains decoded token data
  res.json({
    success: true,
    message: 'User profile',
    user: req.user
  });
});
```

---

## Error Responses

### Common Error Status Codes

| Status Code | Meaning | Use Case |
|------------|---------|----------|
| 200 | OK | Successful login or GET request |
| 201 | Created | Successful user registration |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Invalid credentials or expired token |
| 403 | Forbidden | Invalid token or insufficient permissions |
| 404 | Not Found | User or resource not found |
| 409 | Conflict | User already exists (duplicate email/phone) |
| 500 | Internal Server Error | Server error |

### Standard Error Response Format
```json
{
  "success": false,
  "message": "General error message",
  "error": "Specific error details"
}
```

---

## Database Schema

### Users Table

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

### Field Descriptions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NULL | User email address |
| phone | VARCHAR(20) | UNIQUE | User phone number |
| password_hash | VARCHAR(255) | NOT NULL | Hashed user password (using bcrypt) |
| role | ENUM | DEFAULT 'user' | User role (admin or user) |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| created_at | TIMESTAMP | DEFAULT NOW | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW, ON UPDATE | Last update timestamp |
| is_verified | BOOLEAN | DEFAULT FALSE | Email/phone verification status |
| status | ENUM | DEFAULT 'active' | Account status (active, inactive, blocked) |

---

## Security Notes

1. **Password Hashing**: Passwords are hashed using bcryptjs (salt rounds: 10)
2. **JWT Tokens**: Tokens expire after 7 days
3. **Token Secret**: Change `JWT_SECRET` in `.env` for production
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: All inputs are validated before processing
6. **Error Messages**: Generic error messages prevent information leakage

---

## Testing

### Test Suite Example

```bash
# 1. Sign-up a new user
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'

# Save the returned token for testing

# 2. Login with the same credentials
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@example.com",
    "password": "Test@123456"
  }'

# 3. Use the token to access protected routes
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token_from_response>"
```

---

## Support

For issues or questions, please refer to the main README.md file or contact the development team.
