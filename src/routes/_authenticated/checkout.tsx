import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Banknote, Smartphone, MessageCircle, ShieldCheck, Truck, ChevronRight, ChevronLeft, MapPin, Plus, Check, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — डोर Creation" }] }),
  component: CheckoutPage,
});

type Step = 1 | 2 | 3;

type AddressForm = {
  id?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

const emptyAddress: AddressForm = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

const PAYMENT_METHODS = [
  { id: "cod" as const, label: "Cash on Delivery", desc: "Pay in cash when your order arrives. Available across India.", icon: Banknote, badge: "Most Popular" },
  { id: "upi" as const, label: "UPI / Online Payment", desc: "Pay securely via UPI, card, or net-banking. Confirmation via call.", icon: Smartphone, badge: "Secure" },
  { id: "whatsapp" as const, label: "Confirm on WhatsApp", desc: "We'll send your itemised order to our WhatsApp and confirm payment with you.", icon: MessageCircle, badge: "" },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "whatsapp">("cod");

  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);

  // Load user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  // Saved addresses
  const addressesQ = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const list = addressesQ.data;
    if (list && list.length > 0 && !selectedAddressId) {
      setAddressMode("saved");
      setSelectedAddressId(list[0].id);
    }
  }, [addressesQ.data, selectedAddressId]);

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.price * (i.qty ?? 1), 0);
  const mrpTotal = cart.reduce((s, i) => s + (i.compare_price ?? i.price) * (i.qty ?? 1), 0);
  const mrpSavings = Math.max(0, mrpTotal - subtotal);
  const couponDiscount = coupon ? Math.round((subtotal * coupon.pct) / 100) : 0;
  const shipping = cart.length === 0 ? 0 : subtotal - couponDiscount >= 2000 ? 0 : 150;
  const total = Math.max(0, subtotal - couponDiscount + shipping);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const map: Record<string, number> = { DOR10: 10, FESTIVE5: 5, BRIDAL15: 15 };
    if (map[code]) {
      setCoupon({ code, pct: map[code] });
      toast.success(`Coupon ${code} applied — ${map[code]}% off`);
    } else {
      setCoupon(null);
      toast.error("Invalid coupon");
    }
  }

  function chosenAddress(): AddressForm | null {
    if (addressMode === "saved" && selectedAddressId) {
      const a = addressesQ.data?.find((x) => x.id === selectedAddressId);
      if (!a) return null;
      return {
        id: a.id,
        full_name: a.full_name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        state: a.state ?? "",
        postal_code: a.postal_code,
        country: a.country,
      };
    }
    return form;
  }

  function validateAddress(a: AddressForm | null) {
    if (!a) return "Please choose or enter a shipping address";
    if (!a.full_name.trim()) return "Full name is required";
    if (!/^[0-9+\-\s]{8,15}$/.test(a.phone.trim())) return "Enter a valid phone number";
    if (!a.line1.trim()) return "Address line 1 is required";
    if (!a.city.trim()) return "City is required";
    if (!/^[0-9]{5,6}$/.test(a.postal_code.trim())) return "Enter a valid pincode";
    return null;
  }

  const placeOrder = useMutation({
    mutationFn: async () => {
      const a = chosenAddress();
      const err = validateAddress(a);
      if (err) throw new Error(err);
      if (cart.length === 0) throw new Error("Your cart is empty");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Please sign in to place an order");

      // Save new address if requested
      if (addressMode === "new" && saveAddress) {
        await supabase.from("addresses").insert({
          user_id: userData.user.id,
          full_name: a!.full_name,
          phone: a!.phone,
          line1: a!.line1,
          line2: a!.line2 || null,
          city: a!.city,
          state: a!.state || null,
          postal_code: a!.postal_code,
          country: a!.country || "India",
        });
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: userData.user.id,
          payment_method: paymentMethod,
          payment_status: "pending",
          status: "pending",
          subtotal,
          discount: couponDiscount,
          shipping_fee: shipping,
          total,
          coupon_code: coupon?.code ?? null,
          ship_full_name: a!.full_name,
          ship_phone: a!.phone,
          ship_email: email || null,
          ship_line1: a!.line1,
          ship_line2: a!.line2 || null,
          ship_city: a!.city,
          ship_state: a!.state || null,
          ship_postal_code: a!.postal_code,
          ship_country: a!.country || "India",
          notes: notes || null,
        })
        .select("id, order_number")
        .single();
      if (orderErr) throw orderErr;

      const items = cart.map((i) => ({
        order_id: order.id,
        product_id: i.id.length === 36 ? i.id : null,
        name: i.name,
        image: i.img,
        size: i.size || null,
        qty: i.qty ?? 1,
        unit_price: i.price,
        line_total: i.price * (i.qty ?? 1),
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      // For WhatsApp method, open chat with order summary
      if (paymentMethod === "whatsapp" || paymentMethod === "upi") {
        const msg =
          `*New Order ${order.order_number}*\n` +
          `Name: ${a!.full_name}\nPhone: ${a!.phone}\n` +
          `Address: ${a!.line1}${a!.line2 ? ", " + a!.line2 : ""}, ${a!.city}${a!.state ? ", " + a!.state : ""} — ${a!.postal_code}\n\n` +
          `Items:\n` +
          cart.map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ""} × ${i.qty ?? 1} — ₹${(i.price * (i.qty ?? 1)).toLocaleString("en-IN")}`).join("\n") +
          `\n\nTotal: ₹${total.toLocaleString("en-IN")}` +
          `\nPayment: ${paymentMethod === "whatsapp" ? "Confirm on WhatsApp" : "UPI / Online"}`;
        window.open(`https://wa.me/917976521214?text=${encodeURIComponent(msg)}`, "_blank");
      }

      return order;
    },
    onSuccess: (order) => {
      clearCart();
      toast.success("Order placed successfully");
      navigate({ to: "/order/$id", params: { id: order.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Redirect to cart if empty
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add a few pieces before checking out.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Shop now</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Checkout</h1>

        {/* Stepper */}
        <ol className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider">
          {[
            { n: 1, label: "Address" },
            { n: 2, label: "Payment" },
            { n: 3, label: "Review" },
          ].map((s, i) => (
            <li key={s.n} className="flex items-center gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold ${step >= (s.n as Step) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
              </span>
              <span className={step >= (s.n as Step) ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
              {i < 2 && <span className="h-px w-8 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {/* STEP 1: Address */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-cream p-6 animate-fade-in">
                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">Shipping address</h2></div>

                {(addressesQ.data?.length ?? 0) > 0 && (
                  <div className="mt-4 flex gap-2 text-xs">
                    <button onClick={() => setAddressMode("saved")} className={`rounded-full border px-3 py-1.5 ${addressMode === "saved" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>Saved addresses</button>
                    <button onClick={() => setAddressMode("new")} className={`rounded-full border px-3 py-1.5 ${addressMode === "new" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>+ New address</button>
                  </div>
                )}

                {addressMode === "saved" && (addressesQ.data?.length ?? 0) > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {addressesQ.data!.map((a) => (
                      <label key={a.id} className={`cursor-pointer rounded-xl border p-4 text-sm transition ${selectedAddressId === a.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                        <div className="flex items-start gap-2">
                          <input type="radio" name="addr" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold">{a.full_name}</p>
                            <p className="text-xs text-muted-foreground">{a.phone}</p>
                            <p className="mt-1 text-xs">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}{a.state ? `, ${a.state}` : ""} — {a.postal_code}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {addressMode === "new" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Full name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                    <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
                    <Field label="Email" value={email} onChange={setEmail} type="email" wide />
                    <Field label="Address line 1 *" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} wide />
                    <Field label="Address line 2" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} wide />
                    <Field label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                    <Field label="Pincode *" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
                    <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                    <label className="sm:col-span-2 mt-1 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      Save this address to my account
                    </label>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to cart</Link>
                  <button
                    onClick={() => {
                      const err = validateAddress(chosenAddress());
                      if (err) { toast.error(err); return; }
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
                  >
                    Continue to Payment <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Payment method */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-cream p-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold">Payment method</h2>
                <p className="mt-1 text-xs text-muted-foreground">Choose how you'd like to pay. All orders are protected by our authenticity guarantee.</p>

                <div className="mt-5 space-y-3">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${paymentMethod === m.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <input type="radio" name="pm" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="mt-1.5" />
                      <m.icon className="mt-0.5 h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{m.label}</p>
                          {m.badge && <span className="rounded-full bg-[var(--color-saffron)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-maroon)]">{m.badge}</span>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Order notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Customisation requests, gift message, delivery preferences…" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>

                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to address</button>
                  <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground">
                    Review Order <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-border bg-cream p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Shipping to</h3>
                    <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Edit</button>
                  </div>
                  {(() => {
                    const a = chosenAddress();
                    if (!a) return null;
                    return (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="text-foreground font-medium">{a.full_name}</p>
                        <p>{a.phone}{email ? ` · ${email}` : ""}</p>
                        <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                        <p>{a.city}{a.state ? `, ${a.state}` : ""} — {a.postal_code}, {a.country}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-border bg-cream p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Payment method</h3>
                    <button onClick={() => setStep(2)} className="text-xs text-primary hover:underline">Edit</button>
                  </div>
                  <p className="mt-2 text-sm">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>
                </div>

                <div className="rounded-2xl border border-border bg-cream p-6">
                  <h3 className="font-display text-lg font-semibold">Items ({cart.length})</h3>
                  <ul className="mt-3 divide-y divide-border">
                    {cart.map((i) => (
                      <li key={`${i.id}-${i.size ?? ""}`} className="flex gap-3 py-3">
                        <img src={i.img} alt={i.name} className="h-16 w-14 rounded object-cover" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{i.name}</p>
                          <p className="text-xs text-muted-foreground">{i.size ? `Size ${i.size} · ` : ""}Qty {i.qty ?? 1}</p>
                        </div>
                        <p className="text-sm font-semibold">₹{(i.price * (i.qty ?? 1)).toLocaleString("en-IN")}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={placeOrder.isPending}
                  onClick={() => placeOrder.mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)] disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />
                  {placeOrder.isPending ? "Placing order…" : `Place Order · ₹${total.toLocaleString("en-IN")}`}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">By placing this order you agree to our terms. Returns accepted only for defective items.</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-border bg-cream p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Order Summary</h2>

            <div className="mt-4 flex gap-2">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none" />
              <button onClick={applyCoupon} className="rounded-full bg-foreground px-4 text-xs font-semibold uppercase tracking-wider text-cream">Apply</button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Try <b>DOR10</b>, <b>FESTIVE5</b>, <b>BRIDAL15</b></p>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>₹{subtotal.toLocaleString("en-IN")}</dd></div>
              {mrpSavings > 0 && <div className="flex justify-between text-[var(--color-maroon)]"><dt>MRP savings</dt><dd>-₹{mrpSavings.toLocaleString("en-IN")}</dd></div>}
              {coupon && <div className="flex justify-between text-[var(--color-maroon)]"><dt>Coupon ({coupon.code})</dt><dd>-₹{couponDiscount.toLocaleString("en-IN")}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : `₹${shipping}`}</dd></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-lg font-semibold"><dt>Total</dt><dd className="text-primary">₹{total.toLocaleString("en-IN")}</dd></div>
            </dl>

            <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure checkout · your data is encrypted</p>
              <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Pan-India shipping · free above ₹2,000</p>
              <p className="flex items-center gap-2"><Plus className="h-3.5 w-3.5 text-primary" /> Defective-item returns within 7 days</p>
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", wide }: { label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}
