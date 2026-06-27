import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, ShieldCheck, RotateCcw, Tag, ChevronRight, MapPin, Phone, Instagram, Volume2, VolumeX, Star, Quote, Sparkles } from "lucide-react";

import pLehenga from "@/assets/product-lehenga.jpg";
import pBridal from "@/assets/product-bridal.jpg";
import pSuit from "@/assets/product-suit.jpg";
import pSaree from "@/assets/product-saree.jpg";
import pIndo from "@/assets/product-indo.jpg";
import pSharara from "@/assets/product-sharara.jpg";
import showcaseVideo from "@/assets/dor-showcase.mp4.asset.json";
import atelierImg from "@/assets/atelier.jpg";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard, type DisplayProduct } from "@/components/site/ProductCard";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "डोर Creation — Luxury Ethnic Wear | Wholesale, Retail & Customisation" },
      { name: "description", content: "डोर Creation Indore — premium suits, lehengas, bridal wear, sarees & indo-western. Wholesale, retail and customisation. The डोर of Trust." },
      { property: "og:title", content: "डोर Creation — The डोर of Trust" },
      { property: "og:description", content: "Luxury ethnic wear store that's stylish, affordable and made for every woman." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  component: Home,
});


const categories = [
  { name: "Evening Gowns", img: pSuit, q: "Evening Gowns" },
  { name: "Indo Westerns", img: pIndo, q: "Indo Westerns" },
  { name: "Bridal Lehengas", img: pBridal, q: "Bridal Lehengas" },
  { name: "Crop Top Skirt", img: pSharara, q: "Crop Top Skirt" },
  { name: "Ready-to-Wear Sarees", img: pSaree, q: "Ready-to-Wear Sarees" },
  { name: "Carnival Outfits", img: pLehenga, q: "Carnival Outfits" },
  { name: "Suits", img: pSuit, q: "Suits" },
];

const fallbackProducts: DisplayProduct[] = [
  { id: "f1", name: "Premium Embroidered Anarkali Suit", price: 4299, img: pSuit, tag: "New", in_stock: true },
  { id: "f2", name: "Royal Red Bridal Lehenga Set", price: 18499, img: pBridal, tag: "Bridal", in_stock: true },
  { id: "f3", name: "Saffron Silk Designer Lehenga", price: 7899, img: pLehenga, in_stock: true },
  { id: "f4", name: "Banarasi Silk Draped Saree", price: 5299, img: pSaree, tag: "Bestseller", in_stock: true },
  { id: "f5", name: "Mustard Indo-Western Co-ord", price: 3899, img: pIndo, in_stock: true },
  { id: "f6", name: "Blush Pink Embroidered Sharara", price: 4599, img: pSharara, tag: "New", in_stock: true },
  { id: "f7", name: "Festive Anarkali in Peach", price: 5499, img: pSuit, in_stock: true },
  { id: "f8", name: "Bridal Maroon Couture Lehenga", price: 22000, img: pBridal, in_stock: true },
];

function Home() {
  const heroRef = useRef<HTMLVideoElement>(null);
  const [heroMuted, setHeroMuted] = useState(true);

  const productsQ = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const products: DisplayProduct[] = (productsQ.data && productsQ.data.length > 0)
    ? productsQ.data.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        compare_price: p.compare_price != null ? Number(p.compare_price) : null,
        img: p.images?.[0] || pSuit,
        tag: p.tag ?? undefined,
        in_stock: p.in_stock,
      }))
    : fallbackProducts;

  function toggleHeroMute() {
    const v = heroRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setHeroMuted(v.muted);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero video */}
      <section id="home" className="relative h-[70vh] min-h-[480px] w-full overflow-hidden sm:h-[90vh]">
        <video
          ref={heroRef}
          src={showcaseVideo.url}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
            <div className="max-w-xl text-cream animate-fade-in">
              <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[var(--color-accent)]">New Festive Collection 2026</p>
              <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">Where Style Finds Its डोर</h1>
              <p className="mt-4 text-sm sm:text-base text-cream/90">Luxury ethnic wear that's stylish, affordable and made for every woman.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#new-arrival" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-lg transition hover:bg-[var(--color-maroon)]">
                  Shop Now <ChevronRight className="h-4 w-4" />
                </a>
                <Link to="/bridal" className="inline-flex items-center gap-2 rounded-full border border-cream/60 px-7 py-3 text-sm font-semibold uppercase tracking-wider text-cream hover:bg-cream hover:text-foreground">
                  Bridal Couture
                </Link>
              </div>
            </div>
          </div>
        </div>
        <button onClick={toggleHeroMute} aria-label={heroMuted ? "Unmute" : "Mute"} className="absolute bottom-5 right-5 grid h-11 w-11 place-items-center rounded-full bg-cream/85 text-foreground transition hover:bg-cream">
          {heroMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </section>


      {/* Features bar */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
          {[
            { icon: Truck, t: "Free Shipping", s: "On all orders above ₹2000" },
            { icon: ShieldCheck, t: "Secure Payment", s: "100% safe & encrypted" },
            { icon: RotateCcw, t: "Easy Returns", s: "Returns accepted only for defective items" },
            { icon: Tag, t: "Daily Offers", s: "Up to 10% instant off" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3">
              <f.icon className="h-8 w-8 text-primary" />
              <div>
                <h4 className="text-sm font-semibold">{f.t}</h4>
                <p className="text-xs text-muted-foreground">{f.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="best-seller" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Shop by Style</p>
          <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Our Collections</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Wholesale · Retail · Customisation — from everyday elegance to once-in-a-lifetime bridal moments.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.name} to="/search" search={{ q: c.q }} className="group relative overflow-hidden rounded-2xl">
              <img src={c.img} alt={c.name} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-110" width={400} height={533} loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-maroon)]/80 via-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                <h3 className="font-display text-lg font-semibold text-cream">{c.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner strip */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-[var(--color-saffron)] to-primary py-14 text-center text-cream">
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">THE डोर OF TRUST</h2>
        <p className="mt-3 text-sm uppercase tracking-[0.4em]">Wholesale · Retail · Customisation</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 px-4">
          {["The डोर Of Promise", "The डोर Of Her Story", "The डोर Of Pure Craft", "The डोर Of Confidence", "The डोर Of Authenticity"].map((p) => (
            <span key={p} className="rounded-full border border-cream/40 px-4 py-1.5 text-xs">{p}</span>
          ))}
        </div>
      </section>

      {/* Video Story */}
      <VideoStory />

      {/* Reviews */}
      <Reviews />

      {/* New arrivals products */}
      <section id="new-arrival" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Fresh Off the Loom</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">New Arrivals</h2>
          </div>
          <Link to="/lehengas" className="text-sm font-medium uppercase tracking-wider text-primary hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div className="relative">
            <img src={pBridal} alt="About डोर Creation" className="rounded-3xl shadow-2xl" width={800} height={1024} loading="lazy" />
            <div className="absolute -bottom-6 -right-4 rounded-2xl bg-cream p-5 shadow-xl sm:-right-6">
              <p className="font-display text-3xl font-semibold text-primary">10+ Years</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">of Crafting Trust</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary">About डोर Creation</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Where Style Finds Its डोर</h2>
            <p className="mt-5 text-muted-foreground">
              Born in Indore, डोर Creation weaves together heritage craftsmanship and contemporary silhouettes for the modern Indian woman. Every piece in our wholesale, retail and customisation studio carries the same promise — pure fabric, hand-finished embroidery, and a story you'll be proud to wear.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {["Premium Fabrics", "Handcrafted Detailing", "Custom Sizing", "Bridal Consultations"].map((x) => (
                <li key={x} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{x}</li>
              ))}
            </ul>
            <a href="#contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-maroon)]">
              Visit Our Store
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: MapPin, t: "Visit Us", l1: "Behind Vikram Tower,", l2: "Manish Bagh Colony, Sapnasangeeta, Indore", href: "https://www.google.com/maps/search/?api=1&query=Behind+Vikram+Tower+Manish+Bagh+Colony+Sapnasangeeta+Indore", external: true },
            { icon: Phone, t: "Call Us", l1: "+91-7976521214", l2: "+91-9039174549", href: "tel:+917976521214", external: false },
            { icon: Instagram, t: "Follow Us", l1: "@dor_creation_indore", l2: "Daily new arrivals on Instagram", href: "https://instagram.com/dor_creation_indore", external: true },
          ].map((c) => (
            <a
              key={c.t}
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="block rounded-2xl border border-border bg-cream p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              <c.icon className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.l1}</p>
              <p className="text-sm text-muted-foreground">{c.l2}</p>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function VideoStory() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-maroon)] py-16 text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-5 md:items-center">
        <div className="md:col-span-2 animate-fade-in">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-[var(--color-accent)]">
            <Sparkles className="h-3.5 w-3.5" /> Behind The डोर
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">A Glimpse Into Our Atelier</h2>
          <p className="mt-5 text-sm leading-relaxed text-cream/85">
            Step inside our Indore studio — where every drape is hand-finished, every dupatta is paired with care, and every silhouette is built to make her feel unforgettable. From the first stitch of zardozi to the final fall of a dupatta, every piece begins here.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div><p className="font-display text-3xl">10+</p><p className="text-[10px] uppercase tracking-widest text-cream/70">Years</p></div>
            <div><p className="font-display text-3xl">5k+</p><p className="text-[10px] uppercase tracking-widest text-cream/70">Brides Styled</p></div>
            <div><p className="font-display text-3xl">100%</p><p className="text-[10px] uppercase tracking-widest text-cream/70">Hand Crafted</p></div>
          </div>
        </div>
        <div className="relative md:col-span-3">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-cream/10">
            <img
              src={atelierImg}
              alt="Artisan hand-embroidering a bridal lehenga inside the डोर Creation atelier in Indore"
              className="aspect-[4/5] w-full object-cover md:aspect-[5/4]"
              width={1280}
              height={1600}
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 max-w-[78%] rounded-2xl bg-black/40 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)]">Hand Zardozi · Indore Studio</p>
              <p className="mt-1 font-display text-lg">Crafted stitch by stitch, season after season.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { name: "Ananya Sharma", city: "Indore", rating: 5, text: "My bridal lehenga from डोर was a dream. The detailing, the fit, the colours — everything was beyond what I imagined. Got so many compliments on my wedding day!" },
  { name: "Priya Mehta", city: "Bhopal", rating: 5, text: "Customisation experience was seamless. They listened to every little request and delivered a suit that fit me perfectly. Truly the डोर of trust." },
  { name: "Ritika Joshi", city: "Ujjain", rating: 5, text: "Bought two anarkali suits for my sister's wedding functions. Fabric quality is premium and the embroidery is hand-finished. Will be back for festive shopping." },
  { name: "Sneha Agarwal", city: "Indore", rating: 5, text: "Loved the curation. Found exactly the kind of modern indo-western I was looking for — comfortable yet head-turning. Highly recommend." },
];

function Reviews() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Loved By Her</p>
          <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Stories From Our Clients</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Real words from women who've worn डोर on the days that matter most.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r, i) => (
            <article key={r.name} className="relative rounded-2xl border border-border bg-cream p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
              <Quote className="absolute -top-3 left-5 h-7 w-7 rounded-full bg-primary p-1.5 text-primary-foreground" />
              <div className="flex gap-0.5 text-[var(--color-saffron)]">
                {Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">"{r.text}"</p>
              <div className="mt-5 border-t border-border pt-3">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.city}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
