import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { toast } from "sonner";
import { Loader2, User as UserIcon, Upload, LogOut, ShoppingBag, Heart } from "lucide-react";
import { checkAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — डोर Creation" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  newsletter_opt_in: boolean;
};

const EMPTY: Omit<Profile, "id"> = {
  full_name: "", phone: "", avatar_url: "", date_of_birth: "", gender: "",
  address_line1: "", address_line2: "", city: "", state: "", postal_code: "",
  country: "India", newsletter_opt_in: false,
};

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string; created_at?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const access = await checkAdminAccess({ refreshSession: true });
      if (access.isAdmin) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      setUser({ id: u.user.id, email: u.user.email, created_at: u.user.created_at });

      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setProfile(p ?? { id: u.user.id, ...EMPTY });
      setLoading(false);
    })();
  }, [navigate]);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setProfile((p) => (p ? { ...p, [k]: v } : p));
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      update("avatar_url", data?.signedUrl ?? "");
      toast.success("Avatar uploaded — remember to save");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ ...profile, id: user.id });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading || !profile || !user) {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const initials = (profile.full_name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="bg-gradient-to-r from-[var(--color-maroon)] to-primary text-cream">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-10 sm:flex-row sm:items-center">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-24 w-24 rounded-full border-4 border-cream object-cover" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-cream bg-cream/20 font-display text-3xl">{initials}</div>
            )}
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-cream text-primary shadow-lg hover:bg-cream/90">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{profile.full_name || "Welcome"}</h1>
            <p className="mt-1 text-cream/80">{user.email}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-cream/60">
              Member since {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-full border border-cream/40 px-4 py-2 text-sm hover:bg-cream/10">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <Link to="/wishlist" className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary">
            <Heart className="h-5 w-5 text-primary" /> <span className="text-sm font-medium">My Wishlist</span>
          </Link>
          <Link to="/cart" className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary">
            <ShoppingBag className="h-5 w-5 text-primary" /> <span className="text-sm font-medium">My Cart</span>
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <UserIcon className="h-5 w-5 text-primary" /> <span className="text-sm font-medium">Account Details</span>
          </div>
        </aside>

        <form onSubmit={save} className="space-y-8">
          <Section title="Personal Information" subtitle="Tell us a bit about yourself">
            <Field label="Full name"><input value={profile.full_name ?? ""} onChange={(e) => update("full_name", e.target.value)} className={inputCls} placeholder="Your name" /></Field>
            <Field label="Email"><input value={user.email ?? ""} disabled className={`${inputCls} bg-secondary text-muted-foreground`} /></Field>
            <Field label="Phone"><input value={profile.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="+91 9876543210" /></Field>
            <Field label="Date of birth"><input type="date" value={profile.date_of_birth ?? ""} onChange={(e) => update("date_of_birth", e.target.value || null)} className={inputCls} /></Field>
            <Field label="Gender">
              <select value={profile.gender ?? ""} onChange={(e) => update("gender", e.target.value || null)} className={inputCls}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </Section>

          <Section title="Shipping Address" subtitle="Used when checking out via WhatsApp orders">
            <Field label="Address line 1" full><input value={profile.address_line1 ?? ""} onChange={(e) => update("address_line1", e.target.value)} className={inputCls} placeholder="House no, street" /></Field>
            <Field label="Address line 2" full><input value={profile.address_line2 ?? ""} onChange={(e) => update("address_line2", e.target.value)} className={inputCls} placeholder="Area, landmark (optional)" /></Field>
            <Field label="City"><input value={profile.city ?? ""} onChange={(e) => update("city", e.target.value)} className={inputCls} /></Field>
            <Field label="State"><input value={profile.state ?? ""} onChange={(e) => update("state", e.target.value)} className={inputCls} /></Field>
            <Field label="Postal code"><input value={profile.postal_code ?? ""} onChange={(e) => update("postal_code", e.target.value)} className={inputCls} /></Field>
            <Field label="Country"><input value={profile.country ?? ""} onChange={(e) => update("country", e.target.value)} className={inputCls} /></Field>
          </Section>

          <Section title="Preferences" subtitle="Stay in the loop with new arrivals">
            <label className="col-span-full flex items-start gap-3 rounded-xl border border-border bg-background p-4">
              <input type="checkbox" checked={profile.newsletter_opt_in} onChange={(e) => update("newsletter_opt_in", e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-maroon)]" />
              <div>
                <div className="text-sm font-medium">Subscribe to newsletter</div>
                <div className="text-xs text-muted-foreground">Get updates on new bridal collections, lehengas & exclusive offers.</div>
              </div>
            </label>
          </Section>

          <div className="flex justify-end gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)] disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
