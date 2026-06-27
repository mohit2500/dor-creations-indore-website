import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Exchange Policy — डोर Creation" },
      { name: "description", content: "Return and exchange policy for डोर Creation luxury occasion wear." },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-16 animate-fade-in">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Return &amp; Exchange Policy</h1>
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/85">
          <ul className="list-disc space-y-3 pl-6">
            <li>
              Since we deal in luxury occasion wear, <strong>returns are not accepted</strong> once an order is confirmed.
            </li>
            <li>
              We allow <strong>exchanges only in the following cases:</strong>
              <ul className="mt-2 list-[circle] space-y-2 pl-6">
                <li>Size issues (within <strong>3 days</strong> of delivery, unused &amp; with tags intact).</li>
                <li>Defective / damaged product received (must notify us within <strong>48 hours</strong> of delivery).</li>
              </ul>
            </li>
            <li>Custom-made and altered outfits are <strong>not eligible for exchange.</strong></li>
            <li>Exchange shipping costs are to be borne by the customer, except in cases of damaged / incorrect products.</li>
          </ul>
          <p className="pt-6 text-sm text-muted-foreground">
            For exchange requests, please WhatsApp us at{" "}
            <a href="https://wa.me/917976521214" className="font-medium text-primary hover:underline">+91 79765 21214</a>{" "}
            with your order number and clear photos of the product.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
