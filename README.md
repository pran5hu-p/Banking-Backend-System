# 🏦 Banking Backend System

A production-ready, double-entry ledger banking backend built with **Node.js**, **Express**, and **MongoDB**. Designed with financial-grade reliability — every transaction is atomic, auditable, and idempotent.

**Live API:** [`https://banking-backend-system-jqks.onrender.com`](https://banking-backend-system-jqks.onrender.com)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
  - [Auth Routes](#auth-routes)
  - [Account Routes](#account-routes)
  - [Transaction Routes](#transaction-routes)
- [10-Step Transfer Flow](#-10-step-transfer-flow)
- [Security](#-security)
- [Data Models](#-data-models)
- [Error Handling](#-error-handling)
- [Deployment](#-deployment)

---

## ✨ Features

- **Double-Entry Ledger** — Every transaction creates both a DEBIT and a CREDIT ledger entry, ensuring a complete audit trail
- **Idempotent Transactions** — Duplicate requests with the same idempotency key are safely deduplicated
- **Atomic MongoDB Sessions** — Transactions are processed within MongoDB sessions to guarantee consistency
- **JWT Authentication** — Stateless authentication with cookie and Bearer token support
- **Token Blacklisting** — Logged-out tokens are blacklisted with automatic TTL expiry (3 days)
- **System User Support** — A separate auth layer for privileged system-level operations (initial fund seeding)
- **Email Notifications** — Automated emails on registration and transaction completion via OAuth2/Gmail
- **Immutable Ledger** — Ledger entries are write-once; any modification attempt throws an error

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express v5 |
| Database | MongoDB (via Mongoose v9) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Email | Nodemailer (OAuth2 / Gmail) |
| Environment | `dotenv` |

---

## 🏗 Architecture Overview

```
banking-backend-system/
├── server.js                        # Entry point
└── src/
    ├── app.js                       # Express app setup & route mounting
    ├── config/
    │   └── db.js                    # MongoDB connection
    ├── controllers/
    │   ├── auth.controller.js       # Register, login, logout
    │   ├── account.controller.js    # Create account, get accounts, get balance
    │   └── transaction.controller.js # Transfer funds, seed initial funds
    ├── middleware/
    │   └── auth.middleware.js       # JWT verification, system user guard
    ├── models/
    │   ├── user.model.js            # User schema (bcrypt hashing)
    │   ├── account.model.js         # Account schema + getBalance() aggregation
    │   ├── ledger.model.js          # Immutable ledger entries
    │   ├── transaction.model.js     # Transaction records with status lifecycle
    │   └── blackList.model.js       # Token blacklist with TTL index
    ├── routes/
    │   ├── auth.routes.js
    │   ├── account.routes.js
    │   └── transaction.routes.js
    └── services/
        └── email.service.js         # Nodemailer transporter + email templates
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.19.0 or later
- **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A **Gmail** account with OAuth2 configured (for email notifications)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/banking-backend-system.git
cd banking-backend-system
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

**4. Start the server**

```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`.

> ✅ You should see:
> ```
> Connected to MongoDB
> Email server is ready to send messages
> Server is running on port 3000
> ```

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/banking

# JWT secret key (use a long, random string)
JWT_SECRET=your_super_secret_jwt_key

# Gmail OAuth2 credentials for email notifications
EMAIL_USER=your-email@gmail.com
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
```

### Setting Up Gmail OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project and enable the **Gmail API**
3. Create **OAuth 2.0 Credentials** (Desktop app type)
4. Use [OAuth Playground](https://developers.google.com/oauthplayground/) to generate a `REFRESH_TOKEN` for `https://mail.google.com/` scope
5. Paste the `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` into your `.env`

---

## 📡 API Reference

**Base URL:** `https://banking-backend-system-jqks.onrender.com`

All request/response bodies use `application/json`. Authenticated routes require either:
- A `token` cookie set at login/register, **or**
- An `Authorization: Bearer <token>` header

---

### Auth Routes

#### `POST /api/auth/register`

Register a new user. Sends a welcome email on success.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `201`:**

```json
{
  "user": {
    "_id": "64f...",
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "token": "<jwt_token>"
}
```

**Errors:**

| Status | Reason |
|---|---|
| `422` | Email already registered |

---

#### `POST /api/auth/login`

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `200`:**

```json
{
  "user": {
    "_id": "64f...",
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "token": "<jwt_token>"
}
```

**Errors:**

| Status | Reason |
|---|---|
| `404` | User not found |
| `401` | Invalid credentials |

---

#### `POST /api/auth/logout`

Blacklists the current token. Requires authentication.

**Response `200`:**

```json
{
  "message": "User logged out successfully"
}
```

---

### Account Routes

All account routes require authentication.

#### `POST /api/accounts`

Create a new bank account for the authenticated user.

**Response `201`:**

```json
{
  "message": "Account created successfully",
  "account": {
    "_id": "65a...",
    "user": "64f...",
    "status": "ACTIVE",
    "currency": "INR",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /api/accounts`

Retrieve all accounts belonging to the authenticated user.

**Response `200`:**

```json
{
  "accounts": [
    {
      "_id": "65a...",
      "user": "64f...",
      "status": "ACTIVE",
      "currency": "INR"
    }
  ]
}
```

---

#### `GET /api/accounts/balance/:accountId`

Get the current balance of a specific account. Balance is derived by aggregating all CREDIT and DEBIT ledger entries — no stored balance field exists.

**Response `200`:**

```json
{
  "accountId": "65a...",
  "balance": 5000
}
```

**Errors:**

| Status | Reason |
|---|---|
| `404` | Account not found or doesn't belong to user |

---

### Transaction Routes

#### `POST /api/transactions`

Transfer funds between two accounts. Requires authentication.

**Request Body:**

```json
{
  "fromAccount": "65a...",
  "toAccount": "65b...",
  "amount": 1000,
  "idempotencyKey": "unique-key-uuid-here"
}
```

> ⚠️ `idempotencyKey` must be a unique string per transaction (e.g., a UUID). Retrying with the same key returns the original result without creating a duplicate.

**Response `201`:**

```json
{
  "message": "Transaction completed successfully",
  "transaction": {
    "_id": "66c...",
    "fromAccount": "65a...",
    "toAccount": "65b...",
    "amount": 1000,
    "status": "COMPLETED",
    "idempotencyKey": "unique-key-uuid-here"
  }
}
```

**Errors:**

| Status | Reason |
|---|---|
| `400` | Missing required fields |
| `400` | Invalid account IDs |
| `400` | Either account is not ACTIVE |
| `400` | Insufficient balance |
| `200` | Transaction already processed (idempotency) |

---

#### `POST /api/transactions/system/initial-funds`

Seeds initial funds into an account. **Requires system user authentication only.**

**Request Body:**

```json
{
  "toAccount": "65a...",
  "amount": 10000,
  "idempotencyKey": "seed-funds-account-65a"
}
```

**Response `201`:**

```json
{
  "message": "Initial funds transaction completed successfully",
  "transaction": { ... }
}
```

**Errors:**

| Status | Reason |
|---|---|
| `403` | Caller is not a system user |
| `400` | Missing fields or invalid account |

---

## 🔄 10-Step Transfer Flow

The `POST /api/transactions` endpoint follows a strict 10-step process to ensure financial integrity:

```
1.  Validate request fields (fromAccount, toAccount, amount, idempotencyKey)
2.  Check idempotency key — return cached result if already processed
3.  Verify both accounts are ACTIVE
4.  Derive sender balance via ledger aggregation
5.  Start MongoDB session & transaction
6.  Create PENDING transaction record
7.  Create DEBIT ledger entry for sender
8.  Create CREDIT ledger entry for receiver
9.  Update transaction status to COMPLETED & commit session
10. Send email notification to sender
```

If any step between 5–9 fails, the MongoDB session is aborted and no ledger entries are persisted.

---

## 🔒 Security

- **Passwords** are hashed with `bcryptjs` (salt rounds: 10) and never returned in API responses (`select: false`)
- **JWT tokens** expire after **3 days**
- **Logged-out tokens** are stored in a blacklist collection with a TTL index that auto-expires them after 3 days
- **System users** are flagged with an immutable `systemUser` boolean that is hidden from normal queries (`select: false`)
- **Ledger entries** are fully immutable — all Mongoose update/delete hooks throw errors to prevent tampering

---

## 📊 Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `email` | String | Unique, lowercase, validated |
| `name` | String | Required |
| `password` | String | Bcrypt hashed, `select: false` |
| `systemUser` | Boolean | Immutable, `select: false`, default `false` |

### Account
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | Required |
| `status` | Enum | `ACTIVE`, `FROZEN`, `CLOSED` |
| `currency` | String | Default `INR` |

### Transaction
| Field | Type | Notes |
|---|---|---|
| `fromAccount` | ObjectId → Account | Required |
| `toAccount` | ObjectId → Account | Required |
| `amount` | Number | Min 0 |
| `status` | Enum | `PENDING`, `COMPLETED`, `FAILED`, `REVERSED` |
| `idempotencyKey` | String | Unique index |

### Ledger Entry
| Field | Type | Notes |
|---|---|---|
| `account` | ObjectId → Account | Immutable |
| `amount` | Number | Immutable |
| `transaction` | ObjectId → Transaction | Immutable |
| `type` | Enum | `CREDIT` or `DEBIT`, Immutable |

---

## ⚠️ Error Handling

The API returns consistent JSON error responses:

```json
{
  "message": "Human-readable error description"
}
```

Common HTTP status codes used:

| Code | Meaning |
|---|---|
| `200` | Success (also used for idempotent duplicates) |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing/invalid/blacklisted token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `422` | Unprocessable entity (e.g., duplicate email) |
| `500` | Internal server error |

---

## ☁️ Deployment

This project is deployed on **Render**.

### Deploy Your Own Instance

1. Push your repository to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set the **Build Command** to `npm install`
4. Set the **Start Command** to `npm start`
5. Add all environment variables from the [Environment Variables](#-environment-variables) section in the Render dashboard
6. Deploy!

> **Note:** Render free-tier instances spin down after inactivity. The first request after a cold start may take 30–60 seconds.

---

## 📄 License

ISC

---

*Built with ❤️ by **Pranshu** using Node.js, Express, and MongoDB*
