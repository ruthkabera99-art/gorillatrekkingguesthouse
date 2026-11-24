## Administrator sign-in

- Add a dedicated staff sign-in screen directly at `/admin` when nobody is signed in, using the existing email and WhatsApp authentication.
- Include password visibility, forgot-password and back-to-website links, accessible labels, loading feedback, and clear inline errors; do not offer guest registration here.
- Keep signed-in guests out of staff pages with a clear access message and sign-out option. Show the verified staff role in the admin header and keep permission-loading failures retryable.
- Add focused tests for email login, WhatsApp login, and failed-login handling. Check the `/admin` screen on desktop and phone, exercise an invalid login, and inspect build/browser errors.
- A successful real administrator login still requires the user's own credentials.

## Technical details

- New `src/components/admin/AdminLogin.tsx` plus focused tests.
- Update `src/pages/AdminDashboard.tsx` to render that screen instead of redirecting signed-out users to `/auth`.
- Reuse `AuthContext` and `useStaffRole`; no database, role, or authentication-policy changes.
