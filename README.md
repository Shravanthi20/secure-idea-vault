# secure-idea-vault
Secure Idea Vault is a secure web platform that encrypts, authenticates, and digitally signs research idea submissions while providing QR-based ownership verification and strict role-based access control.
A cyber-security focused web application for secure submission, storage, and ownership verification of research and startup ideas using encryption, digital signatures, QR verification, and role-based access control.

### Features

- NIST SP 800-63-2 compliant authentication
- Single-factor and multi-factor login (Password + OTP)
- Role-Based Access Control (Student, Mentor, Admin)
- Salted password hashing (bcrypt)
- Secure RSA key exchange
- AES encrypted idea storage
- Digitally signed ownership certificates
- QR-code based public verification
- Audit logging and attack prevention mechanisms

### Roles
Role	Access
Student	Submit and manage own ideas
Mentor	Review assigned ideas
Admin	Approve, sign and certify ideas

### Security Mechanisms
Component	Implementation
Authentication	Password + OTP (MFA)
Authorization	Access Control List (ACL)
Encryption	AES (data), RSA (key exchange)
Hashing	bcrypt + salt
Digital Signature	RSA + SHA-256
Encoding	QR Code

### Tech Stack

- Frontend: React.js
- Backend: Node.js + Express
- Database: MongoDB
- Crypto: Node.js crypto
- OTP: Nodemailer
- QR Code: qrcode

### Core Modules

- Authentication Module
- Access Control Module
- Idea Vault Module
- Certificate & Digital Signature Module
- QR Verification Module
- Audit Logging Module

### Setup and Running Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/idea-vault-secure.git
   cd secure-idea-vault
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**
   - Create a `.env` file in the `backend` directory.
   - Copy the contents from `.env.example` to `.env`.
   - Update `MONGO_URI` with your MongoDB connection string.
   - Update `EMAIL_USER` and `EMAIL_PASS` with your email credentials (use App Password for Gmail).

4. **Run the Application**
   ```bash
   # Development Mode
   npm run dev

   # Production Mode
   npm start
   ```

### Deployment (Industry Standard)

To deploy this project to a cloud provider (e.g., Render, Vercel, AWS):

1. **Push your code to GitHub/GitLab.**
2. **Connect your repository** to the cloud provider.
3. **Environment Variables**: In the provider's dashboard (Settings > Environment Variables), add the keys from `.env.example` (`MONGO_URI`, `JWT_SECRET`, etc.) with your production values.
   > **Note**: You do NOT upload the `.env` file. It is ignored by git for security.

### User Guide (How people use the app)

This section describes the flow for an **End User** (Student/Mentor) interacting with the deployed application. They do **not** need to configure anything.

1.  **Registration**:
    - User signs up with email and password.
    - System Hashes password (bcrypt) + Salt.
2.  **Login (MFA)**:
    - User enters Email + Password.
    - **Step 1**: Server verifies password hash.
    - **Step 2**: Server sends a 6-digit OTP to the user's email.
    - User checks their email inbox and enters the OTP code.
3.  **Idea Submission (Secure)**:
    - User uploads text/file.
    - System encrypts data (AES) and digitally signs it.
4.  **Verification**:
    - User can generate a QR code for their idea.
    - Anyone scanning the QR code can verify the idea's ownership and integrity.

### Security Testing

- Brute-force protection
- OTP expiration
- Input validation
- Secure sessions
- Rate limiting
