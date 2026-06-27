import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStore, type StoreItem } from "@/lib/store";
import { toast } from "sonner";

export type DisplayProduct = {
  id: string;
  name: string;
  price: number;
  compare_price?: number | null;
  img: string;
  tag?: string;
  in_stock?: boolean;
};

export function ProductCard({ p }: { p: DisplayProduct }) {
  const { addToCart, toggleWishlist, inWishlist } = useStore();
  const item: StoreItem = { id: p.id, name: p.name, price: p.price, img: p.img, compare_price: p.compare_price ?? null };
  const liked = inWishlist(p.id);
  const hasDiscount = p.compare_price != null && Number(p.compare_price) > p.price;
  const discountPct = hasDiscount ? Math.round(((Number(p.compare_price) - p.price) / Number(p.compare_price)) * 100) : 0;

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-xl bg-secondary">
        <Link to="/product/$id" params={{ id: p.id }} aria-label={`View ${p.name}`}>
          <img src={p.img} alt={p.name} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" width={400} height={533} loading="lazy" />
        </Link>
        {p.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">{p.tag}</span>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 mt-7 rounded-full bg-[var(--color-maroon)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">-{discountPct}%</span>
        )}
        <button
          aria-label="Wishlist"
          onClick={() => { toggleWishlist(item); toast.success(liked ? "Removed from wishlist" : "Added to wishlist"); }}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full transition ${liked ? "bg-primary text-primary-foreground" : "bg-cream/90 text-foreground hover:bg-primary hover:text-primary-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </button>
        <button
          disabled={p.in_stock === false}
          onClick={() => { addToCart(item); toast.success("Added to cart"); }}
          className="absolute inset-x-3 bottom-3 translate-y-12 rounded-full bg-foreground py-2.5 text-xs font-semibold uppercase tracking-wider text-cream opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 disabled:bg-muted-foreground"
        >
          {p.in_stock === false ? "Sold out" : "Add to Cart"}
        </button>
      </div>
      <Link to="/product/$id" params={{ id: p.id }} className="mt-3 block">
        <h3 className="line-clamp-1 text-sm font-medium hover:text-primary">{p.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-lg font-semibold text-primary">₹{Number(p.price).toLocaleString("en-IN")}</p>
          {hasDiscount && (
            <>
              <span className="text-xs text-muted-foreground line-through">₹{Number(p.compare_price).toLocaleString("en-IN")}</span>
              <span className="text-[11px] font-semibold text-[var(--color-maroon)]">{discountPct}% off</span>
            </>
          )}
          {p.in_stock === false && <span className="ml-1 text-xs uppercase tracking-wider text-destructive">Sold out</span>}
        </div>
      </Link>
    </article>
  );
}
