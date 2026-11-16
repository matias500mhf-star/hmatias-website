# SOURCE AO — Firebase Authentication

## Firebase project already registered

- Project ID: `hmatias-c660a`
- Web app ID: `1:865045791253:web:90cfa05e71083f09f7041c`
- Web origin: `https://comercialhmatiasps.com`
- Android preview package to register: `com.comercialhmatias.sourceao.preview`

The public web configuration is embedded in `firebase-auth.js`. Firebase web API keys and app identifiers are client configuration, not Admin credentials. Do not add a service-account JSON, private key or Admin SDK credential to the website or mobile app.

## Before enabling sign-in in Firebase Console

1. Open Authentication → Sign-in method.
2. Enable Email/Password.
3. Open Authentication → Settings → Authorized domains.
4. Add `comercialhmatiasps.com`.
5. Review the email verification and password reset templates.
6. Keep Firebase Analytics disabled until its use is explicitly connected to the existing Cookiebot consent state.

## Website

The SOURCE AO public pages now expose an account entry point. The account screen supports email/password registration, sign-in, password reset and sign-out. New accounts receive an email verification message. The static website uses the official modular Firebase browser SDK as versioned ES modules from `gstatic`; no npm install or website bundler step is required for this static frontend.

After sign-in, the web client obtains a Firebase ID token and calls `POST /api/auth/session`. RFQ submission and API calls include the ID token when a user is signed in. Anonymous search and RFQ intake remain available.

## Server validation and data model

The SOURCE AO Cloudflare Worker verifies Firebase ID token signatures using Google's Secure Token JWKS and checks:
- RS256 signature and signing key ID;
- issuer and audience for `hmatias-c660a`;
- subject/UID format;
- expiry, issued-at and authentication timestamps.

D1 stores only the Firebase UID, a server-assigned role and an email-verification flag. The email and display name are returned from the verified token but are not persisted in this identity table. Signed-in RFQs store the Firebase UID alongside the existing encrypted contact/request payload and private tracking token.

The initial role is always `customer`. A user cannot pass their own role in a request or upgrade their permissions. Supplier and HMATIAS operator roles can only be changed through the existing admin-token-protected route:
`POST /api/admin/identities/:uid/role`.
Supported values are `customer`, `supplier`, and `hm_operator`; every change is recorded in `firebase_identity_role_changes`.

Firebase sign-in does not grant access to existing administrative, supplier-contact, cost, margin or commercial workbench endpoints. Those endpoints continue to require the existing server-side `ADMIN_API_TOKEN`.

## Worker configuration and deployment

Set non-secret Worker variable:
`FIREBASE_PROJECT_ID=hmatias-c660a`

It is included in the checked-in Wrangler configurations and in the protected staging/production config generators. Apply migration `0027_firebase_identities.sql` in staging first. Verify:
- valid Firebase token creates a customer identity;
- malformed, expired, wrong-project and invalid-signature tokens are rejected;
- signed-in RFQs store the verified UID;
- anonymous RFQs continue to work;
- a customer cannot set or elevate their role;
- admin-token role changes are audited;
- existing admin routes still reject Firebase customer tokens.

Do not deploy this branch directly to production. Use the normal HMATIAS staging review and production deployment gate.

## Mobile app follow-up

Register an Android app in this same Firebase project using the exact preview package name `com.comercialhmatias.sourceao.preview`. Download the Firebase-generated `google-services.json` and provide it for the isolated Flutter SOURCE AO branch. The mobile app will then use `firebase_core` and `firebase_auth` with the same Firebase project ID, allowing the same Firebase user to sign into website and app. Do not use the KARTA Android package or KARTA Firebase registration.
