import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useStore } from "@/lib/store";
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — डोर Creation" }] }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQty, removeFromCart, clearCart } = useStore();

  const subtotal = cart.reduce((s, i) => s + i.price * (i.qty ?? 1), 0);
  const mrpTotal = cart.reduce((s, i) => s + (i.compare_price ?? i.price) * (i.qty ?? 1), 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const shipping = subtotal === 0 ? 0 : subtotal >= 2000 ? 0 : 150;
  const estTotal = subtotal + shipping;

  async function proceedToCheckout() {
    if (cart.length === 0) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.info("Please sign in to complete your order");
      navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
      return;
    }
    navigate({ to: "/checkout" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl font-semibold">Your Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review your selection before proceeding to secure checkout.</p>

        {cart.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-secondary/30 p-16 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Discover bridal, lehengas and suits crafted for every story.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Shop now</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-xl font-semibold">Your items ({cart.length})</h2>
              <div className="mt-4 space-y-4">
                {cart.map((i) => (
                  <div key={`${i.id}-${i.size ?? ""}`} className="flex gap-4 rounded-2xl border border-border bg-cream p-4">
                    <img src={i.img} alt={i.name} className="h-28 w-24 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col">
                      <h3 className="font-medium">{i.name}</h3>
                      {i.size && <p className="text-xs text-muted-foreground">Size: {i.size}</p>}
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="font-display text-lg font-semibold text-primary">₹{i.price.toLocaleString("en-IN")}</p>
                        {i.compare_price && i.compare_price > i.price && (
                          <span className="text-xs text-muted-foreground line-through">₹{i.compare_price.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button onClick={() => updateQty(i.id, (i.qty ?? 1) - 1)} className="grid h-8 w-8 place-items-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center text-sm">{i.qty ?? 1}</span>
                          <button onClick={() => updateQty(i.id, (i.qty ?? 1) + 1)} className="grid h-8 w-8 place-items-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button onClick={() => { removeFromCart(i.id); toast.success("Removed"); }} className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline">
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={clearCart} className="mt-3 text-xs text-muted-foreground hover:text-destructive">Clear cart</button>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-cream p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-semibold">Order Summary</h2>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>₹{subtotal.toLocaleString("en-IN")}</dd></div>
                {savings > 0 && (
                  <div className="flex justify-between text-[var(--color-maroon)]"><dt>MRP savings</dt><dd>-₹{savings.toLocaleString("en-IN")}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">Estimated shipping</dt><dd>{shipping === 0 ? "Free" : `₹${shipping}`}</dd></div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-lg font-semibold"><dt>Estimated total</dt><dd className="text-primary">₹{estTotal.toLocaleString("en-IN")}</dd></div>
                <p className="text-[11px] text-muted-foreground">Coupons & final total applied at checkout.</p>
              </dl>

              <button
                onClick={proceedToCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)]"
              >
                Proceed to Checkout <ChevronRight className="h-4 w-4" />
              </button>

              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure checkout · COD, UPI & online supported</p>
                <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Free shipping on orders above ₹2,000</p>
              </div>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
