import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function loginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not sign in. Check your connection and try again.";
  if (/invalid login credentials/i.test(message)) return "The email or WhatsApp number and password do not match.";
  if (/email not confirmed/i.test(message)) return "Confirm your email address before signing in.";
  if (/rate|too many|limit/i.test(message)) return "Too many attempts. Wait a moment, then try again.";
  return message;
}

const AdminLogin = () => {
  const { signIn, signInWithPhone } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingAccess, setAwaitingAccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = identifier.includes("@")
        ? await signIn(identifier, password)
        : await signInWithPhone(identifier, password);
      if (result.error) {
        setError(loginErrorMessage(result.error));
        return;
      }
      setAwaitingAccess(true);
    } catch (caught) {
      setError(loginErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || awaitingAccess;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-secondary px-4 py-8 text-secondary-foreground sm:px-6 lg:px-8">
      <Helmet>
        <title>Administrator Sign In — Gorilla Trekking Guest House</title>
        <meta name="description" content="Secure staff sign-in for the Gorilla Trekking Guest House management panel." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-primary/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-primary/10" />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center justify-center gap-16 lg:justify-between">
        <section className="hidden max-w-md lg:block" aria-label="Hotel management">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Gorilla Trekking Guest House</p>
          <h2 className="font-serif text-4xl leading-tight text-secondary-foreground">One secure place to run your hotel.</h2>
          <p className="mt-5 leading-relaxed text-secondary-foreground/70">
            Sign in with your staff account. Your assigned role determines which management pages you can open.
          </p>
        </section>

        <Card className="w-full max-w-md border-border/60 bg-card/95 shadow-luxury backdrop-blur-xl">
          <CardHeader className="space-y-5 p-6 sm:p-8">
            <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to website
            </Link>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 lg:hidden">
              <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Staff access</p>
              <CardTitle className="font-serif text-3xl">Admin Panel sign in</CardTitle>
              <CardDescription>Use your administrator or staff email, WhatsApp number and password.</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-identifier">Email or WhatsApp number</Label>
                <Input
                  id="admin-identifier"
                  name="username"
                  type="text"
                  value={identifier}
                  onChange={(event) => { setIdentifier(event.target.value); setError(""); }}
                  placeholder="admin@example.com or +250788000000"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  disabled={busy}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="admin-password">Password</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(""); }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={busy}
                    className="h-11 pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={busy}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="h-11 w-full gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                {awaitingAccess ? "Checking staff access…" : submitting ? "Signing in…" : "Sign in to Admin Panel"}
              </Button>
              <p aria-live="polite" className="text-center text-xs leading-relaxed text-muted-foreground">
                Staff accounts are created by an administrator in Staff &amp; Roles.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
