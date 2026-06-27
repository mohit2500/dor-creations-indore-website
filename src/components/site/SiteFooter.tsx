import { Instagram, Facebook } from "lucide-react";
import logoAsset from "@/assets/dor-logo.asset.json";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-maroon)] text-cream/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="डोर" className="h-12 w-12 object-contain mix-blend-screen" width={48} height={48} />
            <span className="font-display text-2xl font-semibold text-cream">डोर Creation</span>
          </div>
          <p className="mt-4 text-sm text-cream/70">The डोर of Trust — luxury ethnic wear, hand-crafted in Indore for every woman, every occasion.</p>
          <div className="mt-5 flex gap-3">
            <a href="https://instagram.com/dor_creation_indore" className="grid h-9 w-9 place-items-center rounded-full border border-cream/30 hover:bg-primary hover:border-primary"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-cream/30 hover:bg-primary hover:border-primary"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li><Link to="/bridal" className="hover:text-[var(--color-accent)]">Bridal Wear</Link></li>
            <li><Link to="/lehengas" className="hover:text-[var(--color-accent)]">Lehengas</Link></li>
            <li><Link to="/suits" className="hover:text-[var(--color-accent)]">Suits</Link></li>
            <li><Link to="/wishlist" className="hover:text-[var(--color-accent)]">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-[var(--color-accent)]">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Help</h4>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li><a href="#" className="hover:text-[var(--color-accent)]">Size Guide</a></li>
            <li><a href="#" className="hover:text-[var(--color-accent)]">Shipping</a></li>
            <li><Link to="/returns" className="hover:text-[var(--color-accent)]">Return &amp; Exchange Policy</Link></li>
            <li><a href="#" className="hover:text-[var(--color-accent)]">Customisation</a></li>
            <li><a href="#" className="hover:text-[var(--color-accent)]">Wholesale Enquiry</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Newsletter</h4>
          <p className="mt-4 text-sm text-cream/70">New arrivals, festive drops & private sale invites — straight to your inbox.</p>
          <form className="mt-4 flex">
            <input type="email" required placeholder="Your email" className="w-full rounded-l-full border border-cream/30 bg-transparent px-4 py-2.5 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-[var(--color-accent)]" />
            <button className="rounded-r-full bg-primary px-5 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-saffron)]">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-cream/60">
          <p>© {new Date().getFullYear()} डोर Creation, Indore. All rights reserved.</p>
          <p>Crafted with care · The डोर of Trust</p>
        </div>
      </div>
    </footer>
  );
}
