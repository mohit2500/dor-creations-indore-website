import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Loader2, Package, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — डोर Creation" }] }),
  component: OrdersPage,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-800",
};

function OrdersPage() {
  const ordersQ = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_method, payment_status, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track every order you've placed with डोर Creation.</p>

        {ordersQ.isLoading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : (ordersQ.data?.length ?? 0) === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-secondary/30 p-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">No orders yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your future orders will appear here.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Start shopping</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {ordersQ.data!.map((o) => (
              <Link
                key={o.id}
                to="/order/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-cream p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div>
                  <p className="font-display text-lg font-semibold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">Placed {new Date(o.created_at).toLocaleString("en-IN")}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wider ${STATUS_TONE[o.status] || "bg-secondary"}`}>{o.status}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 uppercase tracking-wider text-muted-foreground">{o.payment_method.toUpperCase()}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 uppercase tracking-wider text-muted-foreground">Payment: {o.payment_status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-primary">₹{Number(o.total).toLocaleString("en-IN")}</p>
                  <ChevronRight className="ml-auto mt-2 h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
