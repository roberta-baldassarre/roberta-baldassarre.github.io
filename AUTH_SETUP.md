# La Trottola authentication setup

La Trottola lives at `/la-trottola/`. The existing portfolio remains public.
Email sign-in uses a one-time magic link (including new account registration),
and Google uses Supabase OAuth. No passwords are collected by this website.

## Configure Supabase

1. Create a Supabase project. In Authentication enable Email and email confirmations.
   Keep new signups enabled if people should be able to join. Configure production
   SMTP, rate limits and abuse monitoring before public launch.
2. Set Site URL to `https://roberta-baldassarre.github.io/la-trottola/` and allow
   exactly `https://roberta-baldassarre.github.io/la-trottola/callback.html` as a
   redirect URL. Avoid wildcard production redirects.
3. Enable Google in Authentication providers. Create a Google Cloud OAuth web
   client, configure its consent screen and register the Supabase callback URL
   shown in the provider settings (`https://PROJECT.supabase.co/auth/v1/callback`).
   Store the Google client ID and secret only in Supabase's provider settings.
   Publish the consent screen or add test users as appropriate.
4. In `la-trottola/assets/config.js`, enter the HTTPS project URL and **publishable**
   key (`sb_publishable_...`). These are intentionally public. Never put a secret
   key, service-role key, Google client secret or database password in the site,
   GitHub, URLs, screenshots or logs. Prefer the publishable key over legacy keys.
5. Apply `supabase/migrations/202610170001_member_profiles.sql` once through a
   migration workflow or Supabase SQL Editor. Profiles are optional; the UI does
   not create or edit them yet. The four policies restrict all operations to the
   authenticated row owner. New data tables also require explicit RLS policies.
6. Deploy the feature branch in a preview environment or merge the reviewed PR
   to the existing GitHub Pages source branch. No Supabase project is provisioned
   by this PR. Until configured, sign-in fails closed with a friendly message.

## Session and security model

The pinned, locally vendored Supabase JS 2.118.0 SDK manages persisted sessions,
refresh, cross-tab events and PKCE verifier storage in browser local storage.
OAuth and magic-link callbacks exchange a short-lived code, immediately remove
callback parameters from browser history and navigate to the fixed member page.
Magic links must be opened in the browser that requested them for PKCE to work.
No arbitrary return URL is accepted. Provider tokens are not separately stored.
Email responses are generic to reduce account enumeration.

The member UI stays hidden until `getUser()` verifies the identity with Supabase.
Sign-out clears this browser's session; it does not sign out other devices.
Session changes and restored browser pages revalidate or hide the member UI.
Network verification failures keep the member UI hidden.

**GitHub Pages serves every HTML/JS file publicly.** Client-side navigation guards
cannot protect static secrets or confidential HTML. The member page is an empty
account shell. All future private records must be fetched from Supabase under RLS;
use a server or Edge Function with verified identity for privileged operations.
An authenticated account is not a paid membership or administrator role. Do not
use editable user metadata to grant privileges.

Local storage is readable by same-origin JavaScript, including scripts on the
portfolio. Use a dedicated origin or server-managed HttpOnly sessions if stronger
isolation is needed. Keep scripts trusted, avoid unescaped HTML and audit SDK
updates. The auth pages use a restrictive CSP and no remote script imports.
A CSP meta tag cannot supply `frame-ancestors`; configure response headers with a
hosting provider that supports them if anti-framing protection is required.

## Validation before launch

Serve the repository root over HTTP (for example `python3 -m http.server 8000`).
Add the exact localhost callback URL in Supabase only for development.
Run `node --test tests/auth.test.cjs` for isolated authentication behavior checks.
Then test with the actual configured Supabase project:

- Request an email link, open it in the same browser, and verify member entry.
- Try an expired/reused link and one opened in a different browser; both must
  fail without displaying private data. Test Google success and cancellation.
- Visit `member.html` signed out; verify redirect, then test reload, sign-out,
  back/forward navigation, session expiration, cross-tab sign-out and offline use.
- With users A and B, insert a profile under A's UUID. Verify A can operate on it
  and B cannot read/update/delete it or insert a row under A's UUID. Anonymous
  requests must be denied. Test through the public key API, never service role.
- Check production redirects, SMTP delivery, Google consent and mobile layout.

Automated mocks do not replace provider end-to-end or database policy tests.

## SDK updates

`la-trottola/assets/supabase.js` is the upstream MIT-licensed UMD bundle from
`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js`.
Its checksum is recorded in `la-trottola/assets/supabase.sha256`. Update the pinned
version, license, checksum and behavior tests together. No build pipeline is needed.

References: [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow),
[Google](https://supabase.com/docs/guides/auth/social-login/auth-google),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Saved plans
Apply `supabase/migrations/202610180001_member_plans.sql` to enable private account backups. The member page provides explicit backup and restore actions; normal planner edits stay in local storage. Backups exclude auth credentials and contain only allowlisted planner keys. Verify anonymous denial and isolation between two users before enabling this for launch. Restore replaces planner keys on the device and does not provide live multi-device sync.

## Community discoveries activation
Apply `supabase/migrations/202610180003_community.sql` after review. Insert the trusted moderator's auth UUID into `public.community_moderators` through the SQL Editor; users cannot grant themselves this role. No moderator is seeded in the migration. Enable only after testing with two separate users and an anonymous session: pending posts private, published feed public, one vote per user/post, private saves, edits return to pending, authors cannot approve, reporters cannot read other reports. Test moderator approval and unpublishing. Shopping, photo uploads and comments are intentionally deferred. Community is unavailable until migration is applied; no demo posts or fake votes are shown. Configure provider signup abuse protection before public promotion.
