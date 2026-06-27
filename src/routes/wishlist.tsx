import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useStore } from "@/lib/store";
import { Heart, X, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Your Wishlist — डोर Creation" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Your Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-secondary/30 p-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any product to save it for later.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Browse collections</Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((p) => (
              <div key={p.id} className="group relative">
                <div className="overflow-hidden rounded-xl bg-secondary">
                  <img src={p.img} alt={p.name} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <button onClick={() => toggleWishlist(p)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-cream/95 text-foreground hover:bg-destructive hover:text-cream">
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-3">
                  <h3 className="line-clamp-1 text-sm font-medium">{p.name}</h3>
                  <p className="mt-1 font-display text-lg font-semibold text-primary">₹{p.price.toLocaleString("en-IN")}</p>
                  <button
                    onClick={() => { addToCart(p); toast.success("Added to cart"); }}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ShoppingBag className="h-4 w-4" /> Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
