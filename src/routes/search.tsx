import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard, type DisplayProduct } from "@/components/site/ProductCard";

const schema = z.object({ q: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [{ title: "Search — डोर Creation" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const query = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,tag.ilike.%${q}%`);
      if (error) throw error;
      return data ?? [];
    },
  });

  const results: DisplayProduct[] = (query.data ?? []).map((p) => ({
    id: p.id, name: p.name, price: Number(p.price), img: p.images?.[0] ?? "", tag: p.tag ?? undefined, in_stock: p.in_stock,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">
          {q ? <>Results for "<span className="text-primary">{q}</span>"</> : "Search"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{query.isLoading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}</p>

        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
        {!query.isLoading && q && results.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-secondary/30 p-12 text-center text-sm text-muted-foreground">
            Nothing matched your search. Try "bridal", "lehenga" or "suit".
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
