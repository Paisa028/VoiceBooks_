# VoiceBooks

**VoiceBooks** is a full-stack, voice-enabled accounting application developed by **CodeSyndicate** for the **INSY7315 Work Integrated Learning– POE Task 2: Code and Implementation** project.

VoiceBooks is designed to simplify everyday accounting for small businesses by allowing users to capture financial transactions either manually or through voice input. The system converts transaction information into structured accounting data, stores it securely, and supports an accountant review workflow before approved transactions are reflected in accounting records.

The application demonstrates a complete full-stack workflow:

**User Interface → Application Logic → REST API → Authentication & Validation → Accounting Processing → Database → Accountant Review → Accounting Records → User Response**

VoiceBooks supports responsive web interfaces for desktop and mobile-sized screens.

---

# Project Overview

VoiceBooks was created to provide a simpler accounting experience for small-business owners who may not want to work directly with traditional accounting software for every daily transaction.

Instead of requiring the user to understand complex accounting terminology, VoiceBooks allows a transaction to be entered naturally.

For example:

> "I paid R500 for fuel for my business using my bank account."

VoiceBooks can process this information into structured transaction data that can later be reviewed by an accountant.

A user can also choose **Enter Manually** when voice capture is not appropriate.

The system therefore supports two primary transaction-entry methods:

- Voice transaction capture
- Manual transaction capture

Both methods eventually use the same transaction review and accounting workflow.

---

# Project Objectives

The main objectives of VoiceBooks are to:

- Provide an easy-to-use accounting interface for small businesses.
- Support voice-enabled transaction capture.
- Provide manual transaction capture as an alternative.
- Convert transaction information into structured accounting records.
- Support double-entry accounting principles.
- Allow accountants to review business-owner transactions.
- Allow accountants to approve or return transactions.
- Allow business owners to correct and resubmit returned transactions.
- Maintain an audit trail of important transaction actions.
- Provide transaction history.
- Provide a general ledger.
- Provide accounting reports.
- Support authentication and role-based access.
- Protect financial information from unauthorised users.
- Provide responsive interfaces for desktop and mobile-sized devices.
- Demonstrate frontend, backend, REST API and database integration.

---

# Key Features

VoiceBooks currently includes the following major functionality:

### Authentication

- User registration
- Login
- Logout
- Password hashing
- Forgot-password workflow
- Reset-password workflow
- Protected application routes
- Role-based access

### Business Setup

- Business profile creation
- Business information
- Industry information
- Business size
- Country
- Currency
- Accounting integration configuration

### Transaction Management

- Create transaction
- Manual transaction entry
- Voice transaction capture
- Audio transcription
- Transaction information extraction
- Clarification workflow
- Transaction review
- Transaction correction
- Transaction history
- Transaction details
- Transaction resubmission

### Accountant Workspace

- Accountant dashboard
- Assigned clients
- Client details
- Client transactions
- Pending reviews
- Transaction review
- Approve transaction
- Return transaction
- Approved transactions
- Returned transactions
- Accountant profile

### Accounting

- Debit and credit processing
- Journal-entry information
- Transaction categorisation
- General ledger
- Accounting reports
- Transaction status management

### Administration and Configuration

- Settings
- Accountant assignment
- Integrations
- Sage connection workflow
- Firebase/Data Connect support
- Audit records

---

# User Roles

VoiceBooks supports multiple user roles.

## Business Owner

The Business Owner is the primary small-business user.

A Business Owner can:

- Register an account.
- Complete business setup.
- Sign in to VoiceBooks.
- View the business dashboard.
- Create manual transactions.
- Record voice transactions.
- Review transaction information before submission.
- View transaction history.
- View transaction details.
- View approved accounting information.
- Access the general ledger.
- Access reports.
- Manage settings.
- Assign an accountant.
- Remove or replace an accountant.
- Correct returned transactions.
- Resubmit returned transactions.

---

## Accountant

The Accountant provides professional review of accounting transactions.

An Accountant can:

- Sign in using an Accountant account.
- Access the Accountant Workspace.
- View assigned clients.
- View transactions belonging to assigned clients.
- Review pending transactions.
- Review accounting information.
- Approve valid transactions.
- Return transactions requiring correction.
- Provide a reason when returning a transaction.
- View approved transactions.
- View returned transactions.
- Access the accountant profile.

An accountant cannot automatically see every business registered in VoiceBooks.

The Business Owner must explicitly assign the Accountant using the Accountant's registered email address.

---

## Bookkeeper

The Bookkeeper role is included as part of the application's role model.

The current implementation focuses primarily on the Business Owner and Accountant workflows.

Each owner/bookkeeper account represents its own business. Shared bookkeeper membership across multiple businesses is not currently implemented.

---

## Administrator

An Administrator role exists for platform-level administration.

The administrator role cannot be selected through normal public registration.

---

# How VoiceBooks Works

The high-level transaction workflow is:

```text
Business Owner
      │
      ▼
Create Transaction
      │
      ├───────────────┐
      │               │
      ▼               ▼
Voice Capture     Manual Entry
      │               │
      ▼               │
Transcription         │
      │               │
      ▼               │
Information           │
Extraction            │
      │               │
      └───────┬───────┘
              │
              ▼
      Transaction Review
              │
              ▼
       Submit Transaction
              │
              ▼
        Pending Review
              │
              ▼
           Accountant
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
    Approve         Return
       │             │
       ▼             ▼
    Approved      Correction
       │             │
       ▼             ▼
 Ledger/Reports   Business Owner
                     │
                     ▼
                  Correct
                     │
                     ▼
                  Resubmit
                     │
                     └──────► Pending Review
```

---

# System Architecture

VoiceBooks follows a client-server architecture.

```text
┌──────────────────────────────────────────┐
│             React Frontend               │
│                                          │
│ Dashboard                                │
│ Transactions                             │
│ Voice Capture                            │
│ Accountant Workspace                     │
│ Ledger / Reports / Settings              │
└───────────────────┬──────────────────────┘
                    │
                    │ HTTP / REST API
                    ▼
┌──────────────────────────────────────────┐
│         Node.js + Express Backend        │
│                                          │
│ Authentication                           │
│ Authorisation                            │
│ Transaction Processing                   │
│ Voice Transcription                      │
│ Accounting Logic                         │
│ Accountant Workflow                      │
│ Validation                               │
│ Audit Processing                         │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              Data Layer                  │
│                                          │
│ SQLite                                   │
│ Firebase / Data Connect support          │
│ Accounting Data                          │
│ Users / Businesses / Transactions        │
│ Accountant Assignments / Audit Records   │
└──────────────────────────────────────────┘
```

The React frontend does **not** directly manipulate the database.

All protected data operations pass through the backend API.

---

# Technology Stack

## Frontend

- React
- React Router
- JavaScript
- HTML5
- CSS3
- Vite
- Vitest
- Responsive design

## Backend

- Node.js
- Express.js
- JavaScript
- REST API
- Better SQLite3
- JWT-based authentication
- Password hashing
- Cookie-based authentication/session handling
- Helmet security middleware
- CORS
- Input validation
- Jest
- Supertest

## Database

Primary local development storage:

- SQLite

Additional integration support:

- Firebase
- Firebase Data Connect
- PostgreSQL-oriented Data Connect schema/configuration

## Voice Processing

- Browser microphone/audio recording
- Deepgram Speech-to-Text API
- Deepgram Nova speech model configuration

## Development and DevOps

- Git
- GitHub
- VS Code
- npm
- Postman
- GitHub-based version control workflow

---

# Project Structure

The main repository structure is:

```text
VoiceBooks/
│
├── backend/
│   ├── scripts/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── firebase/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.js
│   │   ├── config.js
│   │   └── server.js
│   │
│   ├── tests/
│   │   ├── integration/
│   │   └── unit/
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── accountant/
│   │   │   └── transactions/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── dataconnect/
│   ├── backend/
│   ├── schema/
│   └── dataconnect.yaml
│
├── docs/
│   └── firebase-sql.md
│
├── .firebaserc
├── .gitignore
├── firebase.json
└── README.md
```

---

# Prerequisites

Before running VoiceBooks, install the following software.

## Required

### 1. Git

Git is required to clone the repository and work with version control.

Verify the installation:

```bash
git --version
```

### 2. Node.js

VoiceBooks uses Node.js.

The project has been developed and tested using **Node.js 24**.

Verify Node.js:

```bash
node --version
```

### 3. npm

npm is normally installed together with Node.js.

Verify npm:

```bash
npm --version
```

On Windows PowerShell, if script execution prevents `npm` from running, use:

```powershell
npm.cmd
```

instead of:

```powershell
npm
```

### 4. Code Editor

Visual Studio Code is recommended.

### Optional

The following tools are useful but are not required simply to launch the local application:

- Postman
- GitHub Desktop
- Firebase CLI
- SQLite database viewer

---

# Clone the Repository

Open PowerShell, Command Prompt, Git Bash or a VS Code terminal.

Clone the repository:

```bash
git clone https://github.com/EMGPPT/insy7315-2026-poe-task-2-group-3.git
```

Enter the project:

```bash
cd insy7315-2026-poe-task-2-group-3
```

The repository contains separate `frontend` and `backend` applications.

---

# Installation

Dependencies must be installed separately for the backend and frontend.

## Install Backend Dependencies

From the project root:

```bash
cd backend
npm ci
```

Windows PowerShell users who receive an execution policy error can use:

```powershell
npm.cmd ci
```

---

## Install Frontend Dependencies

Open another terminal or return to the root:

```bash
cd frontend
npm ci
```

On Windows PowerShell:

```powershell
npm.cmd ci
```

---

# Environment Configuration

The backend requires environment configuration.

Never commit the real `.env` file to GitHub.

The repository contains:

```text
backend/.env.example
```

Create your local environment file.

From the `backend` directory in Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Open:

```text
backend/.env
```

and configure the required environment variables.

At minimum, configure a stable JWT secret.

Example:

```env
JWT_SECRET=replace_with_a_long_random_secret
```

For voice transcription, configure:

```env
DEEPGRAM_API_KEY=your_deepgram_api_key
```

**Never place a real API key or production secret inside README.md or commit it to GitHub.**

---

# Deepgram API Key

Voice transcription requires a valid Deepgram API key.

If the key is missing or invalid, voice transcription will fail.

A typical authentication failure may return:

```text
401 Unauthorized
INVALID_AUTH
Invalid credentials
```

If this occurs:

1. Verify that `DEEPGRAM_API_KEY` exists in `backend/.env`.
2. Verify that the API key is valid.
3. Make sure there are no extra spaces around the value.
4. Restart the backend after changing `.env`.
5. Confirm that `.env` is ignored by Git.

Manual transaction entry remains available even when voice transcription is unavailable.

---

# Running the Application

VoiceBooks requires the backend and frontend to run at the same time.

Use **two terminals**.

---

## Terminal 1 – Backend

From the project root:

```bash
cd backend
npm run dev
```

Windows PowerShell:

```powershell
cd backend
npm.cmd run dev
```

The API should start on:

```text
http://localhost:3715
```

A successful startup should show a message similar to:

```text
VoiceBooks API running on http://localhost:3715
```

---

## Terminal 2 – Frontend

From the project root:

```bash
cd frontend
npm run dev
```

Windows PowerShell:

```powershell
cd frontend
npm.cmd run dev
```

Vite normally starts the application on:

```text
http://localhost:5173
```

Open that address in a browser.

---

# Accessing VoiceBooks

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:3715
```

Health endpoint:

```text
GET /api/health
```

A successful health request returns:

```json
{
  "ok": true
}
```

---

# Authentication and Onboarding

A new user begins with the authentication and onboarding workflow.

```text
Create Account
      ↓
Select Role
      ↓
Enter User Information
      ↓
Validate Information
      ↓
Create Account
      ↓
Business Setup
      ↓
Onboarding
      ↓
Integration / Sage Setup
      ↓
Onboarding Complete
      ↓
Application Dashboard
```

The application includes pages for:

- Login
- Signup
- Role selection
- Business setup
- Forgot password
- Reset password
- Onboarding
- Sage connection
- Onboarding success

Protected application pages require authentication.

---

# Business Owner Workflow

A typical Business Owner workflow is:

```text
Register
   ↓
Complete Business Setup
   ↓
Login
   ↓
Dashboard
   ↓
Settings
   ↓
Assign Accountant
   ↓
Create Transaction
   ↓
Voice OR Manual
   ↓
Review
   ↓
Submit
   ↓
Pending Review
   ↓
Accountant Review
```

The owner can continue using:

- Dashboard
- Transactions
- Ledger
- Reports
- Integrations
- Settings

---

# Accountant Workflow

The accountant uses a separate Accountant Workspace.

After registering an Accountant account, the accountant does **not** automatically gain access to businesses.

A Business Owner must assign the accountant.

The workflow is:

```text
Accountant Registration
        ↓
Accountant Login
        ↓
Business Owner assigns accountant email
        ↓
Client becomes available
        ↓
Accountant Dashboard
        ↓
Clients
        ↓
Client Details
        ↓
Pending Transaction
        ↓
Review
        ↓
Approve OR Return
```

The Accountant Workspace includes:

- Accountant Dashboard
- Clients
- Client Details
- Transaction Review
- Approved Transactions
- Returned Transactions
- Accountant Profile

---

# Assigning an Accountant

This step is essential.

The Business Owner must:

1. Sign in using the Business Owner account.
2. Open **Settings**.
3. Locate **Accountant Access**.
4. Enter the email address belonging to a registered Accountant account.
5. Save the assignment.

The system verifies that the email belongs to an account with the `accountant` role.

After assignment, that accountant can access the business as a client.

If the Business Owner removes the accountant, the accountant loses access to that business.

If the owner replaces the accountant, access is transferred to the newly assigned accountant.

This prevents accountants from accessing businesses that have not explicitly assigned them.

---

# Manual Transaction Workflow

VoiceBooks includes manual entry so that users are not dependent on voice recognition.

The general workflow is:

```text
New Transaction
      ↓
Enter Manually
      ↓
Transaction Type
      ↓
Customer / Supplier
      ↓
Description
      ↓
Amount
      ↓
Account Category
      ↓
Payment Information
      ↓
Date / Notes
      ↓
Review
      ↓
Submit
      ↓
Pending Review
```

The application validates the transaction before it is stored.

---

# Voice Transaction Workflow

Voice capture is one of the primary VoiceBooks features.

The workflow is:

```text
New Transaction
      ↓
Voice Capture
      ↓
Microphone Permission
      ↓
Recording
      ↓
Stop Recording
      ↓
Processing
      ↓
Deepgram Transcription
      ↓
Transaction Information Extraction
      ↓
Missing / Unclear Information?
      ↓
Clarification if required
      ↓
Transaction Review
      ↓
Edit if required
      ↓
Confirm
      ↓
Submit
      ↓
Pending Review
```

Example voice input:

```text
I paid R500 for fuel for my business using my bank account.
```

Another accounting example is:

```text
I bought stationery for R250 and paid cash.
```

This can produce accounting information similar to:

```text
Debit:  Stationery Expense    R250
Credit: Cash                  R250
```

The user always has an opportunity to review the transaction before final submission.

---

# Transaction Review Workflow

New transactions are not automatically treated as final accounting records.

When a Business Owner submits a transaction, its initial status is:

```text
pending_review
```

The assigned Accountant reviews the transaction.

The accountant has two primary decisions.

## Approve

If the transaction is correct:

```text
Pending Review
      ↓
Accountant Review
      ↓
Approve
      ↓
Approved
      ↓
Accounting Records
      ↓
Ledger / Reports
```

## Return

If information is incorrect or incomplete:

```text
Pending Review
      ↓
Accountant Review
      ↓
Return
      ↓
Reason Provided
      ↓
Business Owner
      ↓
Correct Transaction
      ↓
Resubmit
      ↓
Pending Review
```

A transaction that has already been reviewed cannot simply be reviewed again without following the appropriate correction/resubmission workflow.

---

# Transaction Statuses

VoiceBooks uses the following core transaction statuses:

| Status | Meaning |
|---|---|
| `pending_review` | Transaction is waiting for accountant review |
| `approved` | Transaction has been approved by the accountant |
| `returned` | Transaction has been returned to the owner for correction |

For user-facing accounting behaviour:

```text
pending_review → not yet posted
approved       → posted/approved accounting record
returned       → correction required
```

---

# Dashboard

The Business Owner dashboard provides a summary of accounting activity.

It is designed to provide quick access to important information such as:

- Recent transactions
- Accounting activity
- Transaction values
- Transaction statuses
- Navigation to transaction history
- Business financial information

The dashboard obtains information through the backend rather than directly accessing the database.

---

# General Ledger

The General Ledger provides accounting records based on approved transaction information.

A transaction follows the double-entry accounting principle.

Each accounting transaction should have corresponding debit and credit entries.

Example:

```text
Purchase:
Business stationery paid using cash

Debit:
Stationery Expense

Credit:
Cash
```

The debit and credit amounts must balance.

Transactions awaiting accountant review should not be treated as fully approved accounting records.

---

# Reports

VoiceBooks includes a Reports area for presenting accounting information based on approved business transactions.

Reports are intended to provide useful financial summaries to the Business Owner.

Only valid business data belonging to the authenticated user should be included.

---

# REST API

VoiceBooks uses a REST-style API implemented using Node.js and Express.

Primary API groups include:

```text
/api/auth
/api/onboarding
/api/admin
/api/accountant
/api/transcriptions
/api/transactions
```

The application also exposes:

```text
GET /api/health
```

The backend is responsible for:

- Authentication
- Authorisation
- Input validation
- Accounting processing
- Database operations
- Voice transcription integration
- Transaction management
- Accountant access
- Error handling

---

# Authentication API

The authentication API is mounted under:

```text
/api/auth
```

Authentication functionality includes:

| Operation | Purpose |
|---|---|
| Register | Create a VoiceBooks user account |
| Login | Authenticate an existing user |
| Logout | End the authenticated session |
| Profile / current user | Retrieve authenticated-user information |
| Forgot password | Start password-reset process |
| Reset password | Change password using valid reset information |

Common authentication endpoints used by the application include operations equivalent to:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/profile
```

Authentication and protected-route behaviour are handled by the backend middleware.

---

# Transaction API

Transaction routes are mounted under:

```text
/api/transactions
```

The transaction API supports the transaction lifecycle, including:

- Creating transactions
- Retrieving transactions
- Retrieving individual transaction details
- Processing structured transaction information
- Resubmitting returned transactions
- Retrieving audit information where applicable

The backend ensures transactions are associated with the correct business/client.

A Business Owner cannot retrieve another Business Owner's transactions simply by changing an ID.

---

# Transcription API

Voice transcription routes are mounted under:

```text
/api/transcriptions
```

The transcription workflow accepts recorded audio from the frontend and communicates with the configured speech-to-text service.

The current voice workflow uses Deepgram.

Typical processing is:

```text
Browser Audio
     ↓
Frontend
     ↓
Transcription API
     ↓
Deepgram
     ↓
Transcript
     ↓
Transaction Processing
     ↓
Review
```

A valid `DEEPGRAM_API_KEY` is required.

---

# Accountant API

Accountant routes are mounted under:

```text
/api/accountant
```

The Accountant API supports operations such as:

- Accountant dashboard
- Assigned clients
- Client details
- Client transactions
- Pending reviews
- Transaction review
- Transaction approval
- Transaction return
- Approved transactions
- Returned transactions
- Accountant profile

Access is scoped to the currently authenticated accountant.

The database assignment is checked before client or transaction information is returned.

This prevents one accountant from viewing another accountant's clients without authorisation.

---

# Onboarding and Settings APIs

Onboarding routes are mounted under:

```text
/api/onboarding
```

The onboarding workflow manages the initial account/business setup process.

Settings functionality supports business configuration, including accountant assignment.

The accountant assignment links:

```text
Business Client
      ↓
Accountant Assignment
      ↓
Registered Accountant User
```

Assignments are stored in the database rather than existing only in frontend state.

---

# Database

VoiceBooks uses SQLite as the primary local development database.

The default local database is:

```text
backend/data/voicebooks.db
```

The exact location can be controlled through configuration such as `DATABASE_FILE`.

Important data structures include:

### Roles

Stores application roles such as:

- Business Owner
- Accountant
- Bookkeeper
- Administrator

### Users

Stores user account information.

Important information includes:

- Email
- Password hash
- First name
- Last name
- Phone
- Role
- Onboarding state

### Business Profiles

Stores business information linked to the user.

Examples:

- Business name
- Registration number
- VAT number
- Industry
- Business size
- Country
- Currency
- Sage status

### Password Reset Tokens

Stores secure password-reset information.

Only token hashes should be stored rather than raw reset tokens.

### Clients

Represents business clients used by the accountant workspace.

### Accountant Assignments

Links a client/business to its assigned accountant.

### Transactions

Stores accounting transactions.

Information can include:

- Client
- Description
- Amount
- Supplier/party
- Category
- Debit account
- Credit account
- Status
- Original transcription
- Supporting information
- Approval information
- Rejection/return reason
- Created timestamp

### Transaction Audit

Records important actions performed on transactions.

---

# Accounting Processing

VoiceBooks applies basic double-entry accounting concepts.

A valid journal transaction should contain:

```text
Total Debits = Total Credits
```

For example:

```text
Transaction:
Fuel purchased for R500 using the business bank account

Debit:
Fuel Expense                  R500

Credit:
Bank                          R500
```

Accounting processing is handled by backend services rather than trusting the browser to create authoritative accounting records.

This separation improves data integrity.

---

# Audit Trail

VoiceBooks records important transaction events.

Examples include:

```text
TRANSACTION_SUBMITTED
TRANSACTION_RESUBMITTED
TRANSACTION_APPROVED
TRANSACTION_RETURNED
ACCOUNTANT_ASSIGNED
ACCOUNTANT_REMOVED
```

Audit information helps provide traceability for financial operations.

An audit record can contain information such as:

- Transaction
- Client
- Actor
- Action
- Source
- Timestamp

Submission, review and resubmission operations are designed so that their corresponding audit information is stored with the database operation.

---

# Security

Security is an important part of VoiceBooks because the system handles user and financial information.

Implemented security considerations include:

### Password Protection

Passwords must never be stored as plain text.

Passwords are stored using secure password hashing.

### Authentication

Protected backend operations require authentication.

### JWT / Authentication Secret

The backend requires a secure and stable `JWT_SECRET`.

Do not use a short or predictable production secret.

If no proper secret is configured during local development, temporary behaviour may cause sessions to reset when the backend restarts.

### Role-Based Access Control

Access is restricted according to user role.

For example:

- Business Owners access their business data.
- Accountants access assigned clients.
- Administrative operations are restricted.

### Client Isolation

Accountant queries verify the relationship between:

```text
Accountant
   ↓
Accountant Assignment
   ↓
Client
   ↓
Transaction
```

### Environment Variables

Secrets such as:

```text
JWT_SECRET
DEEPGRAM_API_KEY
```

must remain in:

```text
backend/.env
```

The `.env` file must never be committed.

### HTTP Security

The Express backend uses security middleware such as Helmet.

### CORS

Cross-origin communication is restricted using configured frontend origins.

### Input Size and Validation

The backend limits and validates incoming data rather than accepting arbitrary request content.

### Database Foreign Keys

Database relationships use foreign-key constraints to protect relational integrity.

---

# Deepgram Voice Transcription

VoiceBooks integrates speech-to-text functionality using Deepgram.

The backend sends recorded audio for transcription.

A successful request returns transcription data that VoiceBooks can use during transaction processing.

The application has used Deepgram's Nova-family speech recognition configuration.

## Common Deepgram Error

```text
Status code: 401
INVALID_AUTH
Invalid credentials
```

This means the API rejected the provided credentials.

Check:

```env
DEEPGRAM_API_KEY=...
```

After changing the key, restart the backend.

Do not expose the Deepgram key in:

- React source code
- README
- GitHub
- Screenshots
- Public documentation

The API key belongs on the backend.

---

# Firebase / Data Connect Support

VoiceBooks also contains Firebase/Data Connect integration support.

Relevant project areas include:

```text
firebase.json
.firebaserc
dataconnect/
backend/src/firebase/
docs/firebase-sql.md
```

The repository includes Data Connect configuration and schema resources for database integration/testing.

For detailed Firebase-related configuration, see:

```text
docs/firebase-sql.md
```

Local SQLite remains supported for straightforward local development and testing.

---

# Testing

VoiceBooks includes automated backend and frontend tests.

---

## Backend Tests

Enter the backend:

```bash
cd backend
```

Run:

```bash
npm test
```

Windows PowerShell:

```powershell
npm.cmd test
```

A complete backend test run for the integrated application should execute the Jest test suites.

During the final integration verification, the backend completed:

```text
Test Suites: 5 passed, 5 total
Tests:       88 passed, 88 total
```

Backend tests include areas such as:

- Validation
- Models
- Security
- Authentication integration
- Transaction integration

---

## Frontend Tests

Enter:

```bash
cd frontend
```

Run:

```bash
npm test -- --run
```

Windows PowerShell:

```powershell
npm.cmd test -- --run
```

---

# Production Build

Before submitting or deploying the application, verify that the frontend can build successfully.

Enter:

```bash
cd frontend
```

Run:

```bash
npm run build
```

Windows PowerShell:

```powershell
npm.cmd run build
```

The production output is generated in:

```text
frontend/dist/
```

During final integration verification, the frontend successfully completed a Vite production build.

---

# Testing the API

The API can be tested using Postman or another REST client.

Start the backend first:

```powershell
cd backend
npm.cmd run dev
```

Then verify:

```text
GET http://localhost:3715/api/health
```

Expected response:

```json
{
  "ok": true
}
```

Protected endpoints require valid authentication.

When testing authenticated functionality, make sure the login/session cookie or required authentication information is preserved between requests.

---

# Troubleshooting

## `npm.ps1 cannot be loaded`

Windows PowerShell may display:

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system
```

You do not need to modify the whole computer's execution policy just to run VoiceBooks.

Use:

```powershell
npm.cmd
```

Example:

```powershell
npm.cmd run dev
```

or:

```powershell
npm.cmd test
```

---

## Backend does not start

Confirm:

```bash
node --version
npm --version
```

Then reinstall dependencies:

```powershell
cd backend
npm.cmd ci
```

Check the `.env` configuration.

---

## Frontend does not start

Run:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

---

## Voice transcription returns 401

Check:

```env
DEEPGRAM_API_KEY
```

A `401 INVALID_AUTH` response normally means the credentials are invalid.

Restart the backend after updating the key.

---

## Accountant Dashboard shows zero clients

This may be expected if no Business Owner has assigned the Accountant.

The Business Owner must:

```text
Login
→ Settings
→ Accountant Access
→ Enter registered accountant email
→ Save
```

Then sign in as that Accountant again or refresh the Accountant Workspace.

---

## Accountant cannot see a transaction

Confirm:

1. The transaction belongs to the correct Business Owner.
2. The Business Owner has assigned the correct Accountant.
3. The Accountant is signed into the correct account.
4. The account role is `accountant`.
5. The transaction has been submitted.
6. The transaction status is appropriate for the selected Accountant page.

---

## Business Owner cannot see transaction in Ledger

A newly submitted transaction may still be:

```text
pending_review
```

The assigned Accountant must approve the transaction before it is treated as an approved/posted accounting record.

---

## Returned transaction

If an Accountant returns a transaction:

1. Sign in as the Business Owner.
2. Open transaction details/history.
3. Review the Accountant's reason.
4. Select the correction/edit option.
5. Correct the transaction.
6. Resubmit it.
7. The transaction returns to `pending_review`.
8. The Accountant can review it again.

---

## JWT warning

If the backend reports that `JWT_SECRET` is missing or too short, configure a proper value in:

```text
backend/.env
```

Use a long, random value.

A temporary development secret may cause existing sessions to become invalid after the backend restarts.

---

# Existing and Legacy Data

VoiceBooks applies additive SQLite migrations so that existing database records are not automatically deleted when newer database structures are introduced.

Older clients without a verified `owner_user_id` remain inaccessible until ownership has been verified.

Legacy JSON files must not automatically be assigned to a Business Owner because their ownership may not be trustworthy.

For a verified single-business legacy transaction file, the backend provides an import script.

From `backend`:

```powershell
node scripts/import-transactions.js owner@example.com ./src/data/transactions.json ./src/data/auditLog.json
```

The audit file is optional.

Mixed-business files should first be separated into verified per-owner files.

The import process is designed to:

- Validate the transaction batch.
- Preserve original files.
- Prevent duplicate legacy IDs.
- Associate imported records with a verified owner.
- Place imported transactions into the review workflow.
- Mark historical imported audit information appropriately.

Existing SQLite clients should not be automatically claimed without ownership verification.

---

# Git and Version Control

VoiceBooks uses Git and GitHub for source control.

Repository:

```text
https://github.com/EMGPPT/insy7315-2026-poe-task-2-group-3.git
```

Recommended workflow:

```text
main
  ↑
develop
  ↑
feature branches
```

Feature branches have been used for areas such as:

```text
feature/accountant-workspace
feature/client-dashboard
feature/dashboard-ledger
feature/login
feature/settings-integrations
feature/voice-transactions
```

Developers should avoid committing directly to shared branches while actively developing isolated features unless the team workflow specifically requires it.

Before committing:

```bash
git status
```

Stage changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Describe the change"
```

Push the appropriate branch:

```bash
git push origin <branch-name>
```

Never commit:

```text
.env
node_modules/
local database files
API keys
passwords
service-account credentials
```

---

# Running VoiceBooks After Downloading the ZIP

If the project is supplied as a ZIP rather than cloned through Git:

1. Download the ZIP.
2. Right-click the ZIP.
3. Select **Extract All**.
4. Open the extracted VoiceBooks folder in VS Code.
5. Open a terminal.
6. Install backend dependencies:

```powershell
cd backend
npm.cmd ci
```

7. Create and configure:

```text
backend/.env
```

8. Start the backend:

```powershell
npm.cmd run dev
```

9. Open another terminal.
10. Install frontend dependencies:

```powershell
cd frontend
npm.cmd ci
```

11. Start the frontend:

```powershell
npm.cmd run dev
```

12. Open:

```text
http://localhost:5173
```

The backend should be available at:

```text
http://localhost:3715
```

---

# Quick Start

For experienced developers, the complete local setup can be summarised as follows.

```powershell
git clone https://github.com/EMGPPT/insy7315-2026-poe-task-2-group-3.git

cd insy7315-2026-poe-task-2-group-3

cd backend
npm.cmd ci
Copy-Item .env.example .env

# Edit .env and configure JWT_SECRET and DEEPGRAM_API_KEY

npm.cmd run dev
```

Open a second terminal:

```powershell
cd insy7315-2026-poe-task-2-group-3\frontend

npm.cmd ci
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

---

# Complete Demonstration Scenario

The following scenario can be used to demonstrate the integrated system.

## Step 1 – Create Accountant

Register an account and select:

```text
Accountant
```

Remember the Accountant's registered email address.

## Step 2 – Create Business Owner

Register another account as:

```text
Business Owner
```

Complete the business setup and onboarding process.

## Step 3 – Assign Accountant

While signed in as the Business Owner:

```text
Settings
→ Accountant Access
→ Enter Accountant email
→ Save
```

## Step 4 – Create Transaction

Choose:

```text
New Transaction
```

Then use either:

```text
Voice Capture
```

or:

```text
Enter Manually
```

Complete the transaction and submit it.

The transaction should enter:

```text
pending_review
```

## Step 5 – Accountant Review

Log out of the Business Owner account.

Sign in using the Accountant account.

Open:

```text
Accountant Dashboard
→ Clients
→ Select Client
→ Transaction
→ Review
```

## Step 6 – Approve

If the transaction is correct:

```text
Approve
```

The transaction becomes:

```text
approved
```

It can then participate in approved accounting records such as the Ledger and Reports.

## Step 7 – Return

Alternatively, the Accountant can return the transaction and provide a reason.

The Business Owner can then:

```text
Transaction Details
→ Correct
→ Edit
→ Resubmit
```

The transaction becomes:

```text
pending_review
```

again and can be reviewed by the Accountant.

This scenario demonstrates the complete interaction between the Business Owner and Accountant sides of VoiceBooks.

---

# Important Notes

- The backend and frontend must both be running.
- Voice transcription requires a valid Deepgram API key.
- Manual transaction entry remains available without Deepgram.
- An Accountant cannot access a Business Owner until assigned.
- A Business Owner should only access their own financial information.
- Accountant access is scoped to assigned clients.
- Approved and returned transactions follow different workflows.
- Returned transactions can be corrected and resubmitted.
- Local database files must not be committed to GitHub.
- Environment secrets must never be committed.
- `node_modules` must not be committed.
- Use the provided automated tests to verify changes.
- Run a frontend production build before final submission.

---

# Academic Information

**Project:** VoiceBooks  
**Module:** INSY7315 – Work Integrated Learning  
**Assessment:** POE Task 2 – Code and Implementation  
**Project Type:** Full-Stack Web Application  
**Team:** CodeSyndicate

VoiceBooks was developed as an academic software-development project demonstrating the practical integration of:

- Requirements analysis
- User-interface development
- Full-stack application development
- REST API design
- Authentication
- Role-based access control
- Database management
- Accounting logic
- Voice processing
- Third-party API integration
- Testing
- Security
- Git version control
- Team software development

---

# Team

## CodeSyndicate

VoiceBooks was collaboratively developed by the CodeSyndicate project team as part of the INSY7315 Work Integrated Learning project.

The project combines authentication, onboarding, voice transaction processing, manual transaction capture, accounting functionality, client dashboards, accountant review workflows, database integration, security, testing and system integration into one full-stack application.

---

# Final Verification

Before submitting or demonstrating VoiceBooks, verify the following:

```text
[ ] Repository cloned/extracted successfully
[ ] Backend dependencies installed
[ ] Frontend dependencies installed
[ ] backend/.env created
[ ] JWT_SECRET configured
[ ] DEEPGRAM_API_KEY configured if demonstrating voice
[ ] Backend starts successfully
[ ] Frontend starts successfully
[ ] User registration works
[ ] Business Owner login works
[ ] Accountant login works
[ ] Accountant assignment works
[ ] Manual transaction works
[ ] Voice transaction works
[ ] Transaction submission works
[ ] Pending review appears for assigned Accountant
[ ] Accountant can approve transaction
[ ] Accountant can return transaction
[ ] Business Owner can correct returned transaction
[ ] Resubmission works
[ ] Transaction history works
[ ] Ledger works
[ ] Reports work
[ ] Backend tests pass
[ ] Frontend production build succeeds
[ ] No .env file committed
[ ] No API key committed
[ ] No node_modules committed
```

---

# VoiceBooks

**Know your transactions. Review your books. Manage your business more simply.**
