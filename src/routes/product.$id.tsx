import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard, type DisplayProduct } from "@/components/site/ProductCard";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Heart, Star, ShoppingBag, Minus, Plus, Truck, ShieldCheck, RotateCcw, Ruler, Share2, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Product — डोर Creation" }] }),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-10 text-center">
      <div>
        <h1 className="font-display text-2xl">Couldn't load product</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Go home</Link>
      </div>
    </div>
  ),
});

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

type ColorVariant = { name: string; hex: string; images: string[] };

function ProductPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { addToCart, toggleWishlist, inWishlist } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>("");
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [openDesc, setOpenDesc] = useState(true);
  const [openShip, setOpenShip] = useState(false);

  const productQ = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const relatedQ = useQuery({
    queryKey: ["related", productQ.data?.category, id],
    enabled: !!productQ.data?.category,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", productQ.data!.category!)
        .neq("id", id)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [authorName, setAuthorName] = useState("");

  const addReview = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Please sign in to review.");
      const { error } = await supabase.from("reviews").insert({
        product_id: id,
        user_id: userData.user.id,
        rating,
        body: reviewBody,
        author_name: authorName || userData.user.email?.split("@")[0] || "Customer",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review posted");
      setReviewBody("");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (productQ.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-24 w-full animate-pulse rounded bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  const p = productQ.data;
  if (!p) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have been removed or is no longer available.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Back to home</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const baseImages: string[] = (p.images && p.images.length > 0) ? p.images : [];
  const rawVariants = (p as { color_variants?: unknown }).color_variants;
  const colorVariants: ColorVariant[] = Array.isArray(rawVariants)
    ? (rawVariants as ColorVariant[]).filter((v) => v && typeof v.name === "string")
    : [];
  const variantImages = activeColor !== null && colorVariants[activeColor]?.images?.length
    ? colorVariants[activeColor].images
    : null;
  const images: string[] = variantImages ?? baseImages;
  const safeImg = activeImg < images.length ? activeImg : 0;
  const mainImg = images[safeImg] ?? "";
  const liked = inWishlist(p.id);
  const reviews = reviewsQ.data ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const price = Number(p.price);
  const mrp = p.compare_price != null ? Number(p.compare_price) : null;
  const hasDiscount = mrp != null && mrp > price;
  const discountPct = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  const savings = hasDiscount ? mrp! - price : 0;

  const productSizes: string[] = (p.sizes && p.sizes.length > 0) ? p.sizes : [];
  const stockQty: number | null = p.stock_qty ?? null;

  const selectedColorName = activeColor !== null ? colorVariants[activeColor]?.name : undefined;
  const item = { id: p.id, name: p.name, price, img: mainImg, compare_price: mrp };

  function handleAdd() {
    if (productSizes.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    for (let i = 0; i < qty; i++) addToCart({ ...item, size, color: selectedColorName });
    toast.success(`Added ${qty} × ${p?.name}${size ? ` · Size ${size}` : ""}${selectedColorName ? ` · ${selectedColorName}` : ""}`);
  }

  const related: DisplayProduct[] = (relatedQ.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    compare_price: r.compare_price != null ? Number(r.compare_price) : null,
    img: r.images?.[0] || "",
    tag: r.tag ?? undefined,
    in_stock: r.in_stock,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <nav className="mx-auto max-w-7xl px-6 pt-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> <span className="mx-1">/</span>
        <span className="capitalize">{p.category ?? "Collection"}</span> <span className="mx-1">/</span>
        <span className="text-foreground">{p.name}</span>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-8 grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div className="animate-fade-in">
          <div className="overflow-hidden rounded-2xl bg-secondary">
            {mainImg ? (
              <img src={mainImg} alt={p.name} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="aspect-[3/4] grid place-items-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === activeImg ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={src} alt={`${p.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
          {p.tag && <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">{p.tag}</span>}
          <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{p.name}</h1>
          {p.sku && <p className="mt-1 text-xs text-muted-foreground">SKU: {p.sku}</p>}

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {reviews.length ? `${avg.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}
            </span>
          </div>

          {/* Price block */}
          <div className="mt-5">
            {hasDiscount && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground">M.R.P.: <span className="line-through">₹{mrp!.toLocaleString("en-IN")}</span></p>
            )}
            <div className="flex items-baseline gap-3">
              <p className="font-display text-3xl font-semibold text-primary">₹{price.toLocaleString("en-IN")}</p>
              {hasDiscount && (
                <span className="rounded-full bg-[var(--color-maroon)] px-3 py-1 text-xs font-semibold text-cream">-{discountPct}%</span>
              )}
            </div>
            {hasDiscount && (
              <p className="mt-1 text-xs text-[var(--color-maroon)]">You save ₹{savings.toLocaleString("en-IN")}</p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">(Inclusive of all taxes)</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Country of Origin: {p.country_of_origin || "India"}</p>
          </div>

          {/* Color */}
          {colorVariants.length > 0 && (
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Color {selectedColorName && <span className="ml-2 text-primary normal-case">{selectedColorName}</span>}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorVariants.map((c, i) => {
                  const isActive = activeColor === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      title={c.name}
                      onClick={() => { setActiveColor(isActive ? null : i); setActiveImg(0); }}
                      className={`group relative h-10 w-10 rounded-full border-2 transition ${isActive ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={c.name}
                      aria-pressed={isActive}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {productSizes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider">Size {size && <span className="ml-2 text-primary">{size}</span>}</label>
                <button onClick={() => setShowSizeChart(true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Ruler className="h-3.5 w-3.5" /> Size Chart
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {productSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[44px] rounded-md border px-3 py-2 text-sm font-medium transition ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-cream hover:border-primary"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <p className="mt-5 text-xs">
            <span className="text-muted-foreground">Availability:</span>{" "}
            {p.in_stock === false || stockQty === 0 ? (
              <span className="font-semibold text-destructive">Out of stock</span>
            ) : stockQty != null ? (
              <span className="font-semibold text-green-700">{stockQty} in stock</span>
            ) : (
              <span className="font-semibold text-green-700">In stock</span>
            )}
          </p>

          {/* Qty + CTA */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:text-primary"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:text-primary"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              aria-label="Wishlist"
              onClick={() => { toggleWishlist(item); toast.success(liked ? "Removed from wishlist" : "Added to wishlist"); }}
              className={`grid h-12 w-12 place-items-center rounded-full border border-border transition ${liked ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary hover:text-primary"}`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              disabled={p.in_stock === false}
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-cream py-3 text-xs font-semibold uppercase tracking-wider text-foreground transition hover:bg-foreground hover:text-cream disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <Link
              to="/cart"
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)]"
            >
              Buy Now
            </Link>
          </div>

          {/* Trust */}
          <div className="mt-7 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border p-3 text-center"><Truck className="mx-auto mb-1 h-4 w-4 text-primary" />Pan-India Shipping</div>
            <div className="rounded-xl border border-border p-3 text-center"><ShieldCheck className="mx-auto mb-1 h-4 w-4 text-primary" />Authentic Craft</div>
            <div className="rounded-xl border border-border p-3 text-center"><RotateCcw className="mx-auto mb-1 h-4 w-4 text-primary" />Defective Returns</div>
          </div>

          {/* Accordions */}
          <div className="mt-8 divide-y divide-border border-y border-border">
            <button onClick={() => setOpenDesc((v) => !v)} className="flex w-full items-center justify-between py-4 text-left">
              <span className="font-display text-lg font-semibold">Description</span>
              <ChevronDown className={`h-4 w-4 transition ${openDesc ? "rotate-180" : ""}`} />
            </button>
            {openDesc && (
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {p.description || "Hand-crafted in our Indore atelier with premium fabrics and intricate embroidery. Each piece is finished with care to celebrate every woman's story."}
              </p>
            )}
            <button onClick={() => setOpenShip((v) => !v)} className="flex w-full items-center justify-between py-4 text-left">
              <span className="font-display text-lg font-semibold">Shipping & Returns</span>
              <ChevronDown className={`h-4 w-4 transition ${openShip ? "rotate-180" : ""}`} />
            </button>
            {openShip && (
              <div className="pb-4 text-sm text-muted-foreground space-y-1.5">
                <p>• Pan-India shipping; free on orders above ₹2,000.</p>
                <p>• Dispatched within 2–4 business days from Indore.</p>
                <p>• Returns accepted only for defective items within 7 days of delivery.</p>
                <p>• Customisation orders are non-refundable.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) navigator.share({ title: p.name, url }).catch(() => {});
              else { navigator.clipboard.writeText(url); toast.success("Link copied"); }
            }}
            className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="font-display text-2xl font-semibold">Customer Reviews</h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <form
            onSubmit={(e) => { e.preventDefault(); addReview.mutate(); }}
            className="rounded-2xl border border-border bg-secondary/30 p-5"
          >
            <h3 className="font-semibold">Write a review</h3>
            <div className="mt-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button type="button" key={s} onClick={() => setRating(s)} aria-label={`${s} star`}>
                  <Star className={`h-6 w-6 ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              required
              rows={4}
              placeholder="Share your experience…"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addReview.isPending}
              className="mt-3 w-full rounded-full bg-primary py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-60"
            >
              {addReview.isPending ? "Posting…" : "Post review"}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">You must be signed in to post.</p>
          </form>

          <div className="space-y-4">
            {reviewsQ.isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
            {!reviewsQ.isLoading && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">Be the first to review this product.</p>
            )}
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{r.author_name ?? "Customer"}</span>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                      ))}
                    </span>
                  </div>
                  <time className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</time>
                </div>
                {r.body && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{r.body}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="mb-6 font-display text-2xl font-semibold">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}

      {/* Size chart modal */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowSizeChart(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Size Chart (inches)</h3>
              <button onClick={() => setShowSizeChart(false)} className="text-sm text-muted-foreground">Close</button>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2">Size</th><th className="px-3 py-2">Bust</th><th className="px-3 py-2">Waist</th><th className="px-3 py-2">Hip</th></tr>
              </thead>
              <tbody>
                {[
                  ["XS", "32", "26", "34"],
                  ["S", "34", "28", "36"],
                  ["M", "36", "30", "38"],
                  ["L", "38", "32", "40"],
                  ["XL", "40", "34", "42"],
                  ["XXL", "42", "36", "44"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-border">
                    {row.map((c, i) => <td key={i} className="px-3 py-2">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-muted-foreground">Need custom sizing? WhatsApp us at +91-7976521214 — every garment can be tailored to fit you.</p>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
