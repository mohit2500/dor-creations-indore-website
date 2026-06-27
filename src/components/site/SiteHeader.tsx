import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Mail, Search, Heart, ShoppingBag, User, MapPin, Menu, X, LogOut } from "lucide-react";
import logoAsset from "@/assets/dor-logo.asset.json";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV: { label: string; to: string; search?: { q: string } }[] = [
  { label: "Home", to: "/" },
  { label: "Evening Gowns", to: "/search", search: { q: "Evening Gowns" } },
  { label: "Indo Westerns", to: "/search", search: { q: "Indo Westerns" } },
  { label: "Bridal Lehengas", to: "/search", search: { q: "Bridal Lehengas" } },
  { label: "Crop Top Skirt", to: "/search", search: { q: "Crop Top Skirt" } },
  { label: "Sarees", to: "/search", search: { q: "Ready-to-Wear Sarees" } },
  { label: "Carnival", to: "/search", search: { q: "Carnival Outfits" } },
  { label: "Suits", to: "/search", search: { q: "Suits" } },
];

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<null | { email?: string }>(null);
  const { cart, wishlist } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const cartCount = cart.reduce((n, i) => n + (i.qty ?? 1), 0);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearch(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return (
    <>
      <div className="bg-[var(--color-maroon)] text-cream text-xs sm:text-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-4">
            <a href="tel:+917976521214" className="flex items-center gap-1.5 hover:text-[var(--color-accent)]">
              <Phone className="h-3.5 w-3.5" /> +91-7976521214
            </a>
            <a href="mailto:info@dorcreation.com" className="hidden items-center gap-1.5 hover:text-[var(--color-accent)] sm:flex">
              <Mail className="h-3.5 w-3.5" /> info@dorcreation.com
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Behind Vikram Tower, Manish Bagh Colony, Indore
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 md:py-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-4">
          {/* Hamburger — mobile only, left */}
          <button
            aria-label="Menu"
            className="shrink-0 p-1 text-foreground lg:hidden"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo — left aligned on mobile and desktop */}
          <Link to="/" className="flex items-center gap-3 lg:col-start-1">
            <img src={logoAsset.url} alt="डोर Creation" className="h-11 w-11 object-contain sm:h-14 sm:w-14 mix-blend-multiply" width={56} height={56} />
            <div className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-2xl font-semibold text-primary">डोर Creation</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">The डोर of Trust</span>
            </div>
          </Link>

          <nav className="hidden items-center justify-center gap-5 text-[13px] font-medium uppercase tracking-wider lg:flex lg:col-start-2 xl:gap-7">
            {NAV.map((l) =>
              l.to.startsWith("/#") ? (
                <a key={l.label} href={l.to} className="whitespace-nowrap text-foreground/80 transition hover:text-primary">{l.label}</a>
              ) : (
                <Link key={l.label} to={l.to} search={l.search as any} className="whitespace-nowrap text-foreground/80 transition hover:text-primary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
                  {l.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-3 text-foreground sm:gap-4 lg:col-start-3 lg:justify-end">
            <button aria-label="Search" className="hover:text-primary" onClick={() => setSearch(true)}><Search className="h-5 w-5" /></button>

            <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-primary">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{wishlist.length}</span>
              )}
            </Link>

            {user ? (
              <div className="group relative">
                <button aria-label="Account" className="hover:text-primary"><User className="h-5 w-5" /></button>
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-cream p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                  <Link to="/profile" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">My Profile</Link>
                  <Link to="/orders" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">My Orders</Link>
                  <Link to="/wishlist" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">My Wishlist</Link>
                  <Link to="/cart" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">My Cart</Link>
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-secondary">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth" aria-label="Sign in" className="hover:text-primary"><User className="h-5 w-5" /></Link>
            )}

            <Link to="/cart" aria-label="Cart" className="relative hover:text-primary">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {menu && (
          <nav className="border-t border-border bg-cream px-4 py-3 lg:hidden">
            <ul className="flex flex-col gap-3 text-sm uppercase tracking-wider">
              {NAV.map((l) => (
                <li key={l.label}>
                  {l.to.startsWith("/#") ? (
                    <a href={l.to} onClick={() => setMenu(false)}>{l.label}</a>
                  ) : (
                    <Link to={l.to} search={l.search as any} onClick={() => setMenu(false)}>{l.label}</Link>
                  )}
                </li>
              ))}
              {!user && <li><Link to="/auth" onClick={() => setMenu(false)}>Sign In</Link></li>}
            </ul>
          </nav>
        )}
      </header>

      {search && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24" onClick={() => setSearch(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitSearch} className="flex w-full max-w-2xl items-center gap-2 rounded-2xl bg-cream p-3 shadow-2xl">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bridal, lehengas, suits…" className="flex-1 bg-transparent px-2 py-2 text-base outline-none" />
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Search</button>
            <button type="button" onClick={() => setSearch(false)} className="rounded-full p-2 hover:bg-secondary"><X className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
