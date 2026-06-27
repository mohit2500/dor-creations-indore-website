import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ProductCard, type DisplayProduct } from "./ProductCard";

type Props = {
  title: string;
  subtitle: string;
  /** Lower-cased substrings that match the products.category field. */
  match: string[];
  bannerImg: string;
  fallback?: DisplayProduct[];
};

export function CategoryPage({ title, subtitle, match, bannerImg, fallback = [] }: Props) {
  const q = useQuery({
    queryKey: ["products-by-cat", match.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const products: DisplayProduct[] =
    q.data && q.data.length
      ? q.data
          .filter((p) => {
            const c = (p.category ?? "").toLowerCase();
            const t = (p.tag ?? "").toLowerCase();
            return match.some((m) => c.includes(m) || t.includes(m));
          })
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            img: p.images?.[0] ?? bannerImg,
            tag: p.tag ?? undefined,
            in_stock: p.in_stock,
          }))
      : fallback;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
        <img src={bannerImg} alt={title} className="h-full w-full object-cover animate-scale-in" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-maroon)]/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 animate-fade-in">
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-[var(--color-accent)]">डोर Creation</p>
            <h1 className="font-display text-4xl font-semibold text-cream sm:text-6xl">{title}</h1>
            <p className="mt-3 max-w-xl text-sm text-cream/90 sm:text-base">{subtitle}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-16 text-center">
            <h2 className="font-display text-2xl text-foreground">Coming Soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">New {title.toLowerCase()} are being curated. Check back shortly.</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">{products.length} product{products.length === 1 ? "" : "s"}</p>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
