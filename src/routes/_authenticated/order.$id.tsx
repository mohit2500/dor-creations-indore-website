import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Loader2, CheckCircle2, Package, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/order/$id")({
  head: () => ({ meta: [{ title: "Order — डोर Creation" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const itemsQ = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (orderQ.isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="py-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  const o = orderQ.data;
  if (!o) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl">Order not found</h1>
          <Link to="/orders" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground">My orders</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const items = itemsQ.data ?? [];

  const waMsg =
    `Hi, I'd like to follow up on my order *${o.order_number}*\n` +
    `Total: ₹${Number(o.total).toLocaleString("en-IN")} · Payment: ${o.payment_method}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-8 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-semibold">Thank you for your order!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Order <span className="font-semibold text-foreground">{o.order_number}</span> · placed {new Date(o.created_at).toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-muted-foreground">We've sent a confirmation and our team will reach out within a few hours to finalise delivery.</p>
          <a href={`https://wa.me/917976521214?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white">
            <MessageCircle className="h-4 w-4" /> Chat with us
          </a>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-cream p-6">
            <h2 className="font-display text-lg font-semibold">Shipping to</h2>
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="text-foreground font-medium">{o.ship_full_name}</p>
              <p>{o.ship_phone}{o.ship_email ? ` · ${o.ship_email}` : ""}</p>
              <p>{o.ship_line1}{o.ship_line2 ? `, ${o.ship_line2}` : ""}</p>
              <p>{o.ship_city}{o.ship_state ? `, ${o.ship_state}` : ""} — {o.ship_postal_code}, {o.ship_country}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-cream p-6">
            <h2 className="font-display text-lg font-semibold">Payment & status</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Method</dt><dd className="font-medium uppercase">{o.payment_method}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Payment status</dt><dd className="font-medium capitalize">{o.payment_status}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Order status</dt><dd className="font-medium capitalize">{o.status}</dd></div>
              {o.coupon_code && <div className="flex justify-between"><dt className="text-muted-foreground">Coupon</dt><dd className="font-medium">{o.coupon_code}</dd></div>}
            </dl>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-cream p-6">
          <div className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Items ({items.length})</h2></div>
          <ul className="mt-4 divide-y divide-border">
            {items.map((i) => (
              <li key={i.id} className="flex gap-4 py-3">
                {i.image && <img src={i.image} alt={i.name} className="h-20 w-16 rounded object-cover" />}
                <div className="flex-1 text-sm">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.size ? `Size ${i.size} · ` : ""}Qty {i.qty} · ₹{Number(i.unit_price).toLocaleString("en-IN")} each</p>
                </div>
                <p className="text-sm font-semibold">₹{Number(i.line_total).toLocaleString("en-IN")}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>₹{Number(o.subtotal).toLocaleString("en-IN")}</dd></div>
            {Number(o.discount) > 0 && <div className="flex justify-between text-[var(--color-maroon)]"><dt>Discount</dt><dd>-₹{Number(o.discount).toLocaleString("en-IN")}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{Number(o.shipping_fee) === 0 ? "Free" : `₹${Number(o.shipping_fee).toLocaleString("en-IN")}`}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold"><dt>Total</dt><dd className="text-primary">₹{Number(o.total).toLocaleString("en-IN")}</dd></div>
          </dl>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link to="/orders" className="rounded-full border border-border bg-cream px-6 py-2.5 text-sm font-semibold uppercase tracking-wider">All orders</Link>
          <Link to="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Continue shopping</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
