# Lab 4: Registration, login and JWT

## Live Link

- **Live URL:** https://backend-development-lab-04-auth.onrender.com/
- **Local Development URL:** `http://localhost:3000/`

*(If hosting is spinning up from cold sleep on free tier, the API can be verified locally using the test runner below.)*

---

## Objective

Add user registration and login with securely hashed passwords using **bcrypt** and stateless authentication with **JSON Web Tokens (JWT)** in a Node.js and Express server backed by SQLite.

---

## Key Features & Tasks Completed

1. **Body Parsing & Dependency Setup:** Installed `bcrypt` and `jsonwebtoken`. Added `app.use(express.json())` middleware so incoming JSON request bodies are parsed.
2. **Database Schema:** Created a `user` table in SQLite (`userData.db`) with `username` (UNIQUE), `name`, `password` (storing the 60-character bcrypt hash), `gender`, and `location`.
3. **POST `/register/`:** Checks if the username already exists using a parameterized SQL query. If it exists, rejects with HTTP status `400 Bad Request` ("User already exists"). If the user is new, hashes the password using `bcrypt.hash(password, 10)` and safely inserts the record, returning `200 OK` ("User created successfully").
4. **POST `/login/`:** Checks for unknown username and returns `400 Bad Request` ("Invalid user"). Compares the plaintext password against the stored bcrypt hash using `bcrypt.compare`. If passwords do not match, returns `400 Bad Request` ("Invalid password"). On successful credential verification, generates and returns `{ "jwt_token": "<token>" }` using `jwt.sign`.
5. **Secure JWT Payload:** Stores **only** the `username` (never the password or sensitive credentials) in the JWT payload. Signs the token with a server secret constant (`SECRET_KEY`).
6. **Token Inspection & Decoding:** Decoded the generated JWT token on `jwt.io` to inspect and verify the three structural components: Header, Payload, and Signature.
7. **Postman & Database Verification:** Thoroughly tested all success and failure branches in Postman and confirmed SQLite database records only contain salted hashes.

---

## Project Structure

```text
lab-04/
├── index.js              # Express server, SQLite initialization, register & login routes
├── package.json          # Node.js project manifest & scripts
├── package-lock.json     # Dependency lock file
├── .gitignore            # Ignores dependencies, local secrets, and runtime data
├── README.md             # Project documentation, endpoints & viva questions
└── test-runner.js        # Automated test suite for registration, login, and JWT
```

The SQLite database (`userData.db`) is created at runtime and is not committed.
Local screenshots are also excluded because they contain test credentials and JWTs.

---

## How to Run

### 1. Prerequisites
- Node.js (v18 or later)
- npm (Node Package Manager)
- Postman or curl

### 2. Installation
Navigate into the `lab-04` directory and install dependencies:

```bash
cd lab-04
npm install
```

### 3. Environment Variables
Set a private `JWT_SECRET` before starting the server. Do not commit the secret.

```env
PORT=3000
JWT_SECRET=<a-long-random-secret>
```

For example, in PowerShell:

```powershell
$env:JWT_SECRET = "<a-long-random-secret>"
```

### 4. Start the Server

```bash
# Production start
npm start

# Development mode (with auto-restart via nodemon)
npm run dev
```

The server will start listening at:
```text
http://localhost:3000/
```

### 5. Automated Test Runner

To execute all test cases (registration, duplicate checks, login, password comparison, token extraction, and token decoding) in one command:

```bash
npm test
```

---

## Endpoints Table

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| GET | `/` | Root API welcome message | `200 OK` |
| POST | `/register/` | Register a new user with hashed password | `200 OK` / `400 Bad Request` |
| POST | `/login/` | Authenticate user and return JWT token | `200 OK` / `400 Bad Request` |
| GET | `/users/` | Retrieve registered users to verify password hashes | `200 OK` |

---

## API Request and Response Examples

### 1. User Registration (`POST /register/`)
**Request Body (JSON):**
```json
{
  "username": "example_user",
  "name": "Example User",
  "password": "<example-password>",
  "gender": "Male",
  "location": "Example City"
}
```
**Response (Success - 200 OK):**
```text
User created successfully
```
**Response (Duplicate User - 400 Bad Request):**
```text
User already exists
```

---

### 2. User Login (`POST /login/`)
**Request Body (JSON):**
```json
{
  "username": "example_user",
  "password": "<example-password>"
}
```
**Response (Success - 200 OK):**
```json
{
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVtZXNoX2siLCJpYXQiOjE3OTUwMjA0MjR9.MKhx97iV0v0AKVJrLqf5PIGWvGiDB9GUuAXfQBFUoWM"
}
```
**Response (Unknown User - 400 Bad Request):**
```text
Invalid user
```
**Response (Wrong Password - 400 Bad Request):**
```text
Invalid password
```

---

---

## Viva Questions & Answers

### 1. Why POST for login?
- **Security:** GET requests append parameters directly into the URL query string (`/login?username=...&password=...`). URL parameters are saved in browser history, proxy logs, web server access logs, and referrer headers in plain text. POST transmits credentials in the HTTP request body, which is encrypted during transit under HTTPS (TLS).
- **Semantics & Idempotency:** GET requests are defined by RFC standards as safe and idempotent (retrieving data without state changes or authentication handshakes). Login creates an authentication session or generates a signed authorization token, which is an action naturally suited to POST.

### 2. Hash vs Encrypt?
- **Hashing (One-way):** A cryptographic hash function (like bcrypt or SHA-256) transforms input plaintext into a fixed-length string irreversibly. Given the hash, it is computationally infeasible to deduce the original password. Verification is performed by hashing the incoming input and comparing the resulting hashes.
- **Encryption (Two-way):** Encryption transforms plaintext into ciphertext using a key, with the explicit design that anyone possessing the corresponding decryption key can recover the original plaintext. Passwords should **never** be encrypted (because a compromised key exposes all plaintext passwords); they must always be **hashed**.

### 3. What does `jwt.sign()` need?
`jwt.sign(payload, secretOrPrivateKey, [options, callback])` requires:
1. **Payload:** An object containing the claims/data to be encoded into the token (e.g., `{ username: "example_user" }`).
2. **Secret / Private Key:** A secret string (for HMAC algorithms such as HS256) or a private key PEM (for asymmetric RSA/ECDSA algorithms) used to generate the cryptographic signature.
3. **Options (Optional):** Configuration parameters such as token expiration (`expiresIn: "1h"`), algorithm (`algorithm: "HS256"`), or issuer.

### 4. What should never go into the payload?
- **Sensitive data** such as plain-text passwords, password hashes, credit card numbers, Social Security numbers, or confidential personal information.
- **Reason:** The JWT payload is merely **Base64URL encoded**, not encrypted. Anyone who intercepts the token or inspects it on `jwt.io` can decode and view the entire payload contents in plain text. The signature guarantees data **integrity** (that the payload hasn't been tampered with), not secrecy.

---

## Notes: Problems Faced and Solutions

1. **JSON Body Undefined (`req.body`):**
   - *Problem:* When testing POST requests, `req.body` returned `undefined`.
   - *Solution:* Added Express's built-in body parser middleware: `app.use(express.json())` prior to defining any route handlers.

2. **Preventing SQL Injection:**
   - *Problem:* Concatenating `username` or input directly into SQL strings exposes the database to SQL injection attacks.
   - *Solution:* Implemented parameterized SQLite queries using `?` placeholders (e.g., `SELECT * FROM user WHERE username = ?;`, `[username]`).

3. **Asynchronous Password Comparison:**
   - *Problem:* Comparing plain text passwords directly against bcrypt hashes using `===` fails because bcrypt incorporates a random 29-character salt and work factor into the hash.
   - *Solution:* Used `await bcrypt.compare(password, dbUser.password)`, which extracts the salt from the hash, hashes the provided password, and performs a timing-safe comparison.

4. **Trailing Slash Support in Routes:**
   - *Problem:* Client requests or curriculum test scripts may call `/register/` or `/register`, and `/login/` or `/login`.
   - *Solution:* Registered handlers for both `/register/` and `/register`, and `/login/` and `/login` to ensure compatibility across all testing environments.
