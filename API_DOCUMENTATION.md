# Matrimonial Application - Complete API Documentation

## Overview
This document provides comprehensive API documentation for the entire Matrimonial Application backend, covering all public, user-authenticated, admin, and super-admin routes.

- **Base URL**: `http://localhost:3000/api/v1` (or your configured `APP_URL`)
- **Content Type**: `application/json` (or `multipart/form-data` for photo uploads)
- **Authentication**: JWT Bearer Token in `Authorization` header (`Bearer <token>`)

---

## Table of Contents
1. [Authentication (`/auth`)](#1-authentication-apiauth)
2. [User Profiles (`/profiles`)](#2-user-profiles-apiprofiles)
3. [User Photos (`/photos`)](#3-user-photos-apiphotos)
4. [User Search & Discovery (`/users`)](#4-user-search--discovery-apiusers)
5. [Connections & Interests (`/connections`)](#5-connections--interests-apiconnections)
6. [Chat & Messaging (`/chat`)](#6-chat--messaging-apichat)
7. [Admin & Super Admin RBAC (`/admin`)](#7-admin--super-admin-rbac-apiadmin)
8. [Database Schema](#8-database-schema)
9. [Error Response Format & Status Codes](#9-error-response-format--status-codes)

---

## 1. Authentication (`/api/v1/auth`)

### 1.1 Sign-Up
- **Endpoint**: `POST /api/v1/auth/signup`
- **Access**: Public
- **Description**: Registers a new user account. Profile is not yet created. Role is always `'user'`.

#### Request Body
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "securePassword123"
}
```
*(At least one of `email` or `phone` is required. `password` must be at least 6 characters).*

#### Success Response (201 Created)
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
    "created_at": "2026-10-31T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials (user, admin, or super_admin) and returns a signed JWT.

#### Request Body
```json
{
  "emailOrPhone": "user@example.com",
  "password": "securePassword123"
}
```

#### Success Response (200 OK)
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

## 2. User Profiles (`/api/v1/profiles`)

### 2.1 Create Profile
- **Endpoint**: `POST /api/v1/profiles/:userId`
- **Access**: Authenticated (owner only: `req.user.id == userId`)
- **Description**: Submits profile details, career, and education. Newly created profile automatically enters `pending` status for Admin review.

#### Request Body
```json
{
  "first_name": "Rohan",
  "last_name": "Sharma",
  "gender": "male",
  "date_of_birth": "1995-06-15",
  "height_cm": 178,
  "marital_status": "unmarried",
  "religion": "Hindu",
  "caste": "Brahmin",
  "mother_tongue": "Hindi",
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai",
  "bio": "Software engineer passionate about tech and travel.",
  "career_details": [
    {
      "work_type": "private",
      "occupation": "Software Engineer",
      "company_name": "Google",
      "annual_income": "2500000",
      "is_primary": true
    }
  ],
  "user_education": [
    {
      "education_level": "bachelors",
      "degree": "B.Tech",
      "field_of_study": "Computer Science",
      "institution": "IIT Bombay",
      "is_highest": true
    }
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Profile created successfully. It is pending admin approval.",
  "data": {
    "profile": {
      "id": 1,
      "user_id": "1",
      "profile_status": "pending",
      ...
    }
  }
}
```

---

### 2.2 Get User Profile
- **Endpoint**: `GET /api/v1/profiles/:userId`
- **Access**: Authenticated
- **Rules**:
  - A user can always view their own profile.
  - Viewing another user's profile requires having a complete profile and that the target profile is `published`. Admins can view any profile.

---

### 2.3 Update User Profile
- **Endpoint**: `PUT /api/v1/profiles/:userId`
- **Access**: Authenticated (owner only)
- **Note**: If a profile had been marked as `rejected`, updating it automatically resets its `profile_status` back to `pending` so an Admin can re-verify.

---

### 2.4 Delete User Profile
- **Endpoint**: `DELETE /api/v1/profiles/:userId`
- **Access**: Authenticated (owner only)

---

## 3. User Photos (`/api/v1/photos`)

All photo operations require an authenticated JWT token.

- `POST /api/v1/photos/:userId`: Upload up to 5 photos (`multipart/form-data`, field name: `photos`). Owner only.
- `GET /api/v1/photos/:userId`: Retrieve photos for a user.
- `PUT /api/v1/photos/:userId/:photoId`: Update photo flags (e.g. `is_primary: true`). Owner only.
- `DELETE /api/v1/photos/:userId/:photoId`: Delete a photo. Owner only.

---

## 4. User Search & Discovery (`/api/v1/users`)

### 4.1 Search Profiles
- **Endpoint**: `GET /api/v1/users/search`
- **Access**: Authenticated (requires complete profile)
- **Visibility Enforced**: **Only profiles with `profile_status = 'published'` and `role = 'user'` are returned.** Excludes users who have blocked, rejected, or are already connected.

#### Available Query Filters
| Query Param | Type | Description |
|-------------|------|-------------|
| `gender` | string | `male` \| `female` \| `other` |
| `marital_status` | string/array | `unmarried`, `divorced`, `widowed` |
| `religion` | string | Partial match |
| `caste` | string | Partial match |
| `mother_tongue` | string | Partial match |
| `country` | string | Partial match |
| `state` | string | Partial match |
| `city` | string | Partial match |
| `min_age` / `max_age` | number | Calculated from `date_of_birth` |
| `min_height` / `max_height`| number | Height in cm |
| `work_type` | string | `private`, `government`, `business`, etc. |
| `education_level` | string | `bachelors`, `masters`, `doctorate`, etc. |
| `has_photo` | boolean | `'true'` to require primary photo |
| `sort_by` | string | `created_at` \| `age` \| `height` |
| `sort_order` | string | `ASC` \| `DESC` |
| `page` / `limit` | number | Pagination (default: page=1, limit=10) |

---

### 4.2 Other User Routes
- `GET /api/v1/users`: Retrieve all active users.
- `GET /api/v1/users/:id`: Retrieve single user by ID.
- `DELETE /api/v1/users/:id`: Soft delete a user (`is_deleted: true`).

---

## 5. Connections & Interests (`/api/v1/connections`)

- `POST /api/v1/connections/:senderId/interest/:receiverId`: Send interest to another user (requires complete profile).
- `PUT /api/v1/connections/:receiverId/respond/:senderId`: Respond to interest (Body: `{ "action": "accept" | "reject" }`).
- `POST /api/v1/connections/:senderId/block/:receiverId`: Block another user.
- `DELETE /api/v1/connections/:senderId/block/:receiverId`: Unblock a user.
- `GET /api/v1/connections/:userId/interests/received`: List received pending interests.
- `GET /api/v1/connections/:userId/interests/sent`: List sent pending interests.
- `GET /api/v1/connections/:userId`: List accepted mutual connections.
- `GET /api/v1/connections/:userId/blocked`: List blocked users.

---

## 6. Chat & Messaging (`/api/v1/chat`)

- `GET /api/v1/chat/:userId/history/:otherUserId`: Get paginated chat history between two connected users.
- `GET /api/v1/chat/:userId/conversations`: Get inbox / list of all active conversations with latest messages.
- `DELETE /api/v1/chat/:userId/message/:messageId`: Delete a message (sender only).

---

## 7. Admin & Super Admin RBAC (`/api/v1/admin`)

> [!IMPORTANT]
> Detailed diagrams, state transitions, and frontend integration specifications are documented in [`ADMIN_RBAC.md`](./ADMIN_RBAC.md).

All endpoints in this section require `Authorization: Bearer <token>` and appropriate role permissions.

### 7.1 Dashboard Stats
- **Endpoint**: `GET /api/v1/admin/dashboard/stats`
- **Access**: `admin`, `super_admin`
- **Description**: Returns counts of pending/published/rejected profiles. Super admin also receives total admin counts and pending admin requests.

---

### 7.2 Get Pending Profiles Count
- **Endpoint**: `GET /api/v1/admin/profiles/pending/count`
- **Access**: `admin`, `super_admin`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "pending_count": 5
  }
}
```

---

### 7.3 List Pending Profiles
- **Endpoint**: `GET /api/v1/admin/profiles/pending?page=1&limit=20`
- **Access**: `admin`, `super_admin`
- **Description**: Returns paginated profiles with `profile_status = 'pending'`, including Career, Education, and User Photos for verification.

---

### 7.4 Filter & Search All Profiles
- **Endpoint**: `GET /api/v1/admin/profiles`
- **Access**: `admin`, `super_admin`
- **Query Params**: `status` (`pending`|`published`|`rejected`), `search` (name, email, or phone), `page`, `limit`

---

### 7.5 Approve Profile
- **Endpoint**: `PATCH /api/v1/admin/profiles/:userId/approve`
- **Access**: `admin`, `super_admin`
- **Description**: Changes `profile_status` to `'published'` and marks `User.is_verified = true`. The user can now be viewed by others in search.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Profile approved and published successfully",
  "data": {
    "user_id": "12",
    "profile_status": "published",
    "approved_by": 1
  }
}
```

---

### 7.6 Reject Profile
- **Endpoint**: `PATCH /api/v1/admin/profiles/:userId/reject`
- **Access**: `admin`, `super_admin`
- **Request Body**:
```json
{
  "reason": "Please upload a clear primary photo."
}
```

---

### 7.7 Create Admin
- **Endpoint**: `POST /api/v1/admin/create-admin`
- **Access**: `admin`, `super_admin`
- **Behavior**:
  - **Super Admin**: Directly creates an active Admin account (`role = 'admin'`). Returns `201 Created`.
  - **Admin**: Creates a pending request in `admin_requests` for Super Admin review. Returns `200 OK`.

#### Request Body
```json
{
  "email": "newadmin@example.com",
  "phone": "9876500000",
  "password": "SecureAdminPassword123"
}
```

---

### 7.8 List Pending Admin Requests
- **Endpoint**: `GET /api/v1/admin/admin-requests/pending?page=1&limit=20`
- **Access**: `super_admin` only
- **Description**: Returns all requests initiated by Admins awaiting Super Admin review.

---

### 7.9 Approve Admin Request
- **Endpoint**: `PATCH /api/v1/admin/admin-requests/:id/approve`
- **Access**: `super_admin` only
- **Description**: Approves request, sets status to `'approved'`, and automatically provisions the new `User` record with `role = 'admin'`.

---

### 7.10 Reject Admin Request
- **Endpoint**: `PATCH /api/v1/admin/admin-requests/:id/reject`
- **Access**: `super_admin` only
- **Request Body**:
```json
{
  "reason": "Request denied by policy."
}
```

---

### 7.11 List All Admins
- **Endpoint**: `GET /api/v1/admin/admins`
- **Access**: `admin`, `super_admin`
- **Description**: Admins see peer admins only (not their own account or super admins). Super admins see all active admins and super admins.

### 7.12 Update an Admin
- **Endpoint**: `PATCH /api/v1/admin/admins/:id`
- **Access**: `super_admin` only
- **Description**: Updates an active regular admin's email, phone, or status (`active`/`inactive`). Super-admin accounts cannot be changed through this endpoint.

### 7.13 Deactivate an Admin
- **Endpoint**: `DELETE /api/v1/admin/admins/:id`
- **Access**: `super_admin` only
- **Description**: Soft-deletes a regular admin and sets its status to `inactive`. The account history remains in the database; super-admin accounts cannot be deactivated through this endpoint.

---

## 8. Database Schema

### 8.1 Users Table (`users`)
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NULL,
  phone VARCHAR(20) UNIQUE NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
  is_deleted BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8.2 User Profiles Table (`user_profiles`)
```sql
CREATE TABLE user_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  gender ENUM('male', 'female', 'other'),
  date_of_birth DATE,
  height_cm INT,
  marital_status ENUM('unmarried', 'divorced', 'widowed'),
  religion VARCHAR(100),
  caste VARCHAR(100),
  mother_tongue VARCHAR(100),
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  bio TEXT,
  profile_photo VARCHAR(255),
  profile_status ENUM('pending', 'published', 'rejected') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 8.3 Admin Requests Table (`admin_requests`)
```sql
CREATE TABLE admin_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  requested_by BIGINT UNSIGNED NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

---

## 9. Error Response Format & Status Codes

All errors adhere to this standard response structure:
```json
{
  "success": false,
  "message": "Human-readable failure summary",
  "error": "Detailed validation or system error reason"
}
```

| HTTP Status | Meaning | Scenario |
|:-----------:|---------|----------|
| `200 OK` | Request succeeded | Standard reads and successful updates |
| `201 Created` | Resource created | Successful registration, profile/admin creation |
| `400 Bad Request` | Invalid input | Validation errors, missing fields |
| `401 Unauthorized`| Authentication required | Missing or invalid Bearer JWT |
| `403 Forbidden` | Access denied | Non-owner access or insufficient RBAC role |
| `404 Not Found` | Resource not found | Profile or entity does not exist |
| `409 Conflict` | Data conflict | Duplicate email/phone, or already approved |
| `500 Internal Error`| Server error | Database connection or unhandled runtime failure |

---

## 10. Initial Super Admin Seeding

To create the initial Super Admin:
```bash
node src/scripts/seedSuperAdmin.js --email superadmin@example.com --password YourStrongPassword123
```
Login via `/api/v1/auth/login` using these credentials to obtain the Super Admin Bearer JWT.
