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

### Installation
```
git clone https://github.com/your-username/idea-vault-secure.git
cd secure-idea-vault
npm install
npm start
```
### Security Testing

- Brute-force protection
- OTP expiration
- Input validation
- Secure sessions
- Rate limiting
