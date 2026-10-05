# Firebase SQL Connect (Data Connect)

VoiceBooks supports Firebase SQL Connect, backed by PostgreSQL, alongside its
existing SQLite provider. Express keeps the login cookie, validation, role checks
and ownership checks. Firebase Admin credentials stay in the backend; no service
account key is sent to the browser. All connector operations use
`@auth(level: NO_ACCESS)`, so direct client calls cannot bypass Express.

## Run locally without a Firebase project

From `backend`, install dependencies with `npm ci`, then use separate terminals:

```powershell
npm.cmd run firebase:emulators
npm.cmd run dev:firebase
```

Start the frontend from `frontend` with `npm.cmd run dev`.
The emulator uses `demo-voicebooks`, listens at `127.0.0.1:9399`, and stores its
local PostgreSQL-compatible PGlite data in `.firebase/dataconnect`.
If the existing SQLite backend is running on port 3715, stop that backend before
starting `dev:firebase`, or use a different PORT and corresponding frontend proxy.
The CLI downloads its emulator components on first use.

Run `npm.cmd run test:firebase` while the emulator is running. This tests real
Express API requests against the emulator, including ownership, assignments,
concurrent approval, audits, settings, onboarding and single-use password resets.
It removes only the accounts it created. Ordinary Jest tests remain isolated in
SQLite memory and run with `npm.cmd test -- --runInBand`.

## Connect the hosted project

The configured Firebase project is `voicebooks-d7726` in `.firebaserc`.
Its existing service is `voicebooks-d7726-service` in `us-east4`, backed by
Cloud SQL instance `voicebooks-d7726-instance` and database
`voicebooks-d7726-database`. These names are configured in
`dataconnect/dataconnect.yaml` and the backend environment template.
The demo emulator commands continue to explicitly use `demo-voicebooks`.

1. Open `voicebooks-d7726` in Firebase and enable SQL Connect. Hosted SQL Connect uses Cloud
   SQL resources and billing; review the official pricing before provisioning.
2. Choose the region and Cloud SQL instance. Update
   `dataconnect/dataconnect.yaml` to match the region and instance you selected.
3. Authenticate the Firebase CLI, then review and deploy the schema and connector:

   ```powershell
   # From backend
   npx.cmd firebase login
   npx.cmd firebase dataconnect:sql:diff --config ../firebase.json --project voicebooks-d7726
   # Review the SQL above before applying the migration.
   npx.cmd firebase dataconnect:sql:migrate --config ../firebase.json --project voicebooks-d7726
   npx.cmd firebase deploy --only dataconnect --config ../firebase.json --project voicebooks-d7726
   ```

4. Configure backend/.env:

   ```dotenv
   DATABASE_PROVIDER=firebase
   FIREBASE_PROJECT_ID=voicebooks-d7726
   FIREBASE_SERVICE_ID=voicebooks-d7726-service
   FIREBASE_LOCATION=us-east4
   DATA_CONNECT_EMULATOR_HOST=
   JWT_SECRET=YOUR_STABLE_RANDOM_SECRET
   ```

5. Supply Application Default Credentials to the backend, preferably using the
   hosting service's identity. For local hosted-database development, configure
   ADC or set GOOGLE_APPLICATION_CREDENTIALS to a private file outside the repo.
   Use an identity with the required SQL Connect operation permissions.
6. Start the backend with `npm.cmd start`, verify registration and transaction
   review, and configure HTTPS/cookies and API routing for the hosted environment.

The local `backend/.env` now selects Firebase and references a Firebase CLI-managed
ADC file outside the repository. This is a local development credential;
production should use the hosting service's identity. Never copy the credentials
file into source control. The backend checks the hosted schema before listening.
`/api/health` reports the selected database provider.

After deployment, run `npm.cmd run test:firebase:hosted` from `backend` to check
the real hosted API workflow. This creates temporary test accounts and entries,
then removes only the test accounts and their related records. The command refuses
to run unless the configured project is `voicebooks-d7726` and the emulator host is
empty. Existing SQLite accounts and records remain in the local SQLite database;
create a new Firebase account to use the hosted database, or migrate data explicitly.

The demo launcher always targets the emulator; use ordinary `start` for hosted
Firebase. Production rejects emulator configuration. Switching providers starts
with the selected database's accounts and records; existing SQLite data is not
automatically copied or deleted. Plan an explicit verified data migration before
switching an existing business to a hosted database. The legacy JSON import
command is intended only for the SQLite provider.

## Data model

`Account` stores an account and its one-to-one business profile. The accountant
relationship assigns a business to an accountant. `Entry` belongs to an account;
`Audit` records the owner, entry, actor and action; `ResetToken` stores a hashed
token and its expiry. Amounts use PostgreSQL `numeric(20,2)`.

Submission, resubmission, assignment and review operations use `@transaction`.
Review/resubmission updates check the current assignment and status in the write
predicate, then require exactly one affected row before writing the audit.
Password reset consumption similarly checks expiry and usage inside a transaction.
Emails are normalized to lowercase and protected by a unique index.

References: [SQL Connect](https://firebase.google.com/docs/sql-connect),
[Admin SDK](https://firebase.google.com/docs/sql-connect/admin-sdk),
[Emulator](https://firebase.google.com/docs/sql-connect/data-connect-emulator-suite),
[Pricing](https://firebase.google.com/docs/sql-connect/pricing).
