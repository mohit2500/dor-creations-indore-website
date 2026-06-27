import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { checkAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — डोर Creation" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const access = await checkAdminAccess({ refreshSession: true });
      navigate({ to: access.isAdmin ? "/admin" : "/profile", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/profile" },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const access = await checkAdminAccess({ refreshSession: true });
      navigate({ to: access.isAdmin ? "/admin" : "/profile", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/profile", replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-maroon)] via-primary to-[var(--color-saffron)] px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-block text-cream/80 hover:text-cream">← Back to store</Link>
        <div className="rounded-3xl bg-cream p-8 shadow-2xl">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your profile, wishlist, and cart
          </p>

          <button onClick={handleGoogle} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-sm font-medium hover:bg-secondary">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.5l3-3C17.2 1.7 14.8.7 12 .7 7.4.7 3.5 3.3 1.6 7.1l3.5 2.7C6 7 8.8 5 12 5z"/><path fill="#34A853" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#4A90E2" d="M5.1 14.4c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L1.6 7.1C.6 9 0 11.4 0 12s.6 3 1.6 4.9l3.5-2.5z"/><path fill="#FBBC05" d="M12 24c3 0 5.5-1 7.3-2.7l-3.7-2.9c-1 .7-2.3 1.1-3.6 1.1-3.2 0-6-2-7-4.8l-3.5 2.7C3.5 20.7 7.4 24 12 24z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <input type="password" required minLength={6} placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <button disabled={busy} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)] disabled:opacity-50">
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary">
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">Customer account access for डोर Creation</p>
        </div>
      </div>
    </div>
  );
}
