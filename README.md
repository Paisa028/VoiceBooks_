# VoiceBooks
VoiceBooks is a voice-enabled accounting system developed for the INSY7315 Work Integrated Learning project.

## Team
CodeSyndicate

## Task
POE Task 2 - Code and Implementation

## Run locally

Firebase SQL Connect/PostgreSQL is also supported. See [Firebase setup](docs/firebase-sql.md)
for emulator testing and connection to a future Firebase project.

Use Node.js 24. Install dependencies with `npm ci` in both `backend` and `frontend`.
Run `npm run dev` in each directory. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.
Frontend: http://localhost:5173. API: http://localhost:3715.

Copy `backend/.env.example` to `backend/.env` and set a stable JWT_SECRET.
Set DEEPGRAM_API_KEY for audio transcription. Without it, manual entry remains available.
Frontend API requests use `/api`; production hosting must forward that path to the backend.

## Transaction and accountant workflow

1. Register a business-owner account and an accountant account.
2. As the owner, open Settings and assign the accountant's registered email under Accountant access.
3. Submit a manual or voice transaction. It is saved in SQLite as `pending_review`.
4. The assigned accountant can review, approve or return it. Other accountants cannot access it.
5. Approved transactions appear in the owner's ledger and reports. Returned entries show the accountant's reason in transaction details; select Correct and resubmit to submit a revision.
6. Clearing or replacing the accountant email removes the previous accountant's access immediately.

Each owner/bookkeeper account represents its own business; shared bookkeeper membership is not implemented.
Transactions, assignments and audits use the database at DATABASE_FILE (default `backend/data/voicebooks.db` when started from backend).
Submission, review and resubmission write their audit records in the same database transaction.
Tests use a separate in-memory database.

## Existing data

Startup applies additive SQLite migrations without deleting existing tables or records.
Old clients without `owner_user_id` remain inaccessible until their ownership is verified.
Legacy JSON files contain no reliable business owner and are never automatically assigned.
To import a verified, single-business file, run from `backend`:

```powershell
node scripts/import-transactions.js owner@example.com ./src/data/transactions.json ./src/data/auditLog.json
```

The audit file is optional. Split mixed-business files into verified per-owner files first.
Import validates the whole batch, preserves the original files, prevents duplicate legacy IDs,
and places imported transactions into pending review. Historical audit events are marked
`legacy_import`; actor_id identifies the verified owner used for the import, not a reconstructed historical actor.
The CLI does not claim existing SQLite clients; an administrator must verify and map those separately.

## Checks

Backend: `npm test -- --runInBand`. Frontend: `npm test -- --run` and `npm run build`.
