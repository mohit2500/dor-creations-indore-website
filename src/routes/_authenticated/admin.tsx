import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, Upload, X, Store, ShieldAlert, Loader2, GripVertical } from "lucide-react";
import { checkAdminAccess, type AdminAccessResult } from "@/lib/admin-access";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — डोर Creation" }] }),
  component: AdminPage,
});

export type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string | null;
  tag: string | null;
  in_stock: boolean;
  images: string[];
  sort_order: number;
  sizes: string[];
  sku: string | null;
  country_of_origin: string | null;
  stock_qty: number | null;
  color_variants: ColorVariant[];
};

const emptyForm: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  compare_price: null,
  category: "Evening Gowns",
  tag: "",
  in_stock: true,
  images: [],
  sort_order: 0,
  sizes: [],
  sku: "",
  country_of_origin: "India",
  stock_qty: null,
  color_variants: [],
};

const CATEGORIES = ["Evening Gowns", "Indo Westerns", "Bridal Lehengas", "Crop Top Skirt", "Ready-to-Wear Sarees", "Carnival Outfits", "Suits"];
const TAGS = ["", "New", "Bestseller", "Bridal", "Sale"];

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adminAccess, setAdminAccess] = useState<AdminAccessResult | null>(null);

  useEffect(() => {
    (async () => {
      const access = await checkAdminAccess({ refreshSession: true });
      setAdminAccess(access);
    })();
  }, []);

  const productsQ = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    enabled: adminAccess?.isAdmin === true,
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const saveMut = useMutation({
    mutationFn: async (p: Omit<Product, "id"> & { id?: string }) => {
      if (p.id) {
        const { error } = await supabase.from("products").update(p).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      setShowForm(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const reorderMut = useMutation({
    mutationFn: async (rows: Product[]) => {
      // Persist new sort_order for each row
      await Promise.all(
        rows.map((r, idx) =>
          supabase.from("products").update({ sort_order: idx }).eq("id", r.id)
        )
      );
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["public-products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reorder failed"),
  });

  const [localOrder, setLocalOrder] = useState<Product[] | null>(null);
  const dragIdx = useRef<number | null>(null);

  const rows = localOrder ?? productsQ.data ?? [];

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === i) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setLocalOrder(next);
  }
  function onDragEnd() {
    dragIdx.current = null;
    if (localOrder) {
      reorderMut.mutate(localOrder);
      // Optimistically update cached admin list so it doesn't snap back
      qc.setQueryData(["admin-products"], localOrder);
      setLocalOrder(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminAccess === null) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!adminAccess.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-lg rounded-2xl border border-border bg-cream p-8 text-center shadow">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 font-display text-2xl">Not an admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {adminAccess.email || "unknown email"}.</p>
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-left text-xs text-muted-foreground">
            <p><span className="font-semibold text-foreground">User ID:</span> {adminAccess.userId ?? "No authenticated user"}</p>
            <p className="mt-2"><span className="font-semibold text-foreground">Role returned:</span> {adminAccess.roles.length ? adminAccess.roles.join(", ") : "none"}</p>
            <p className="mt-2"><span className="font-semibold text-foreground">Reason:</span> {adminAccess.reason}</p>
          </div>
          <button onClick={handleSignOut} className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-primary">डोर Creation · Admin</h1>
            <p className="text-xs text-muted-foreground">{adminAccess.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"><Store className="h-4 w-4" /> View store</Link>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">{productsQ.data?.length ?? 0} item(s)</p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[var(--color-maroon)]">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>

        {productsQ.isLoading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-cream">
            <p className="border-b border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">Tip: drag the <GripVertical className="inline h-3 w-3" /> handle to reorder how products appear on the store.</p>
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Tag</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr
                    key={p.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="border-t border-border transition hover:bg-secondary/40"
                  >
                    <td className="px-2 py-3 text-muted-foreground"><GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" /></td>
                    <td className="px-4 py-3">
                      {p.images[0] ? <img src={p.images[0]} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="h-14 w-14 rounded bg-secondary" />}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{p.in_stock ? <span className="text-green-700">In stock</span> : <span className="text-destructive">Sold out</span>}</td>
                    <td className="px-4 py-3 text-xs">{p.tag || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate(p.id); }} className="rounded p-1.5 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-cream p-12 text-center">
            <p className="text-muted-foreground">No products yet. Click "Add product" to create your first one.</p>
          </div>
        )}
      </main>

      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(d) => saveMut.mutate(d)}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onClose, onSave, saving }: {
  initial: Product | null;
  onClose: () => void;
  onSave: (d: Omit<Product, "id"> & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Omit<Product, "id"> & { id?: string }>(
    initial ? { ...initial } : { ...emptyForm }
  );
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        // 10-year signed URL (bucket is private)
        const { data, error: signErr } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        uploaded.push(data.signedUrl);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      toast.success(`Uploaded ${uploaded.length} image(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(i: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-semibold">{form.id ? "Edit product" : "New product"}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Images</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((src, i) => (
                <div key={i} className="relative h-24 w-24">
                  <img src={src} alt="" className="h-full w-full rounded object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="mt-1">Upload</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
            <input required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea rows={3} maxLength={1000} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Price (₹) — selling</label>
              <input type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MRP (₹) — strike-through</label>
              <input type="number" min={0} step="0.01" value={form.compare_price ?? ""} onChange={(e) => setForm({ ...form, compare_price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Leave blank for no discount" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">SKU</label>
              <input value={form.sku ?? ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock qty</label>
              <input type="number" min={0} value={form.stock_qty ?? ""} onChange={(e) => setForm({ ...form, stock_qty: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Optional" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Country of origin</label>
              <input value={form.country_of_origin ?? ""} onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <ColorVariantsEditor
            variants={form.color_variants}
            onChange={(v) => setForm({ ...form, color_variants: v })}
          />

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sizes (comma separated, e.g. S, M, L, XL)</label>
            <input
              value={form.sizes.join(", ")}
              onChange={(e) => setForm({ ...form, sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="Leave blank for default S/M/L/XL/XXL"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</label>
              <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tag</label>
              <select value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {TAGS.map((t) => <option key={t} value={t}>{t || "— none —"}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="h-4 w-4" />
            In stock
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
            <button disabled={saving} className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--color-maroon)] disabled:opacity-50">
              {saving ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ColorVariantsEditor({ variants, onChange }: { variants: ColorVariant[]; onChange: (v: ColorVariant[]) => void }) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function update(idx: number, patch: Partial<ColorVariant>) {
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function add() {
    onChange([...variants, { name: "", hex: "#c0392b", images: [] }]);
  }
  function remove(idx: number) {
    onChange(variants.filter((_, i) => i !== idx));
  }
  async function upload(idx: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingIdx(idx);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        const { data, error: signErr } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        uploaded.push(data.signedUrl);
      }
      update(idx, { images: [...variants[idx].images, ...uploaded] });
      toast.success(`Uploaded ${uploaded.length} image(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color variants</label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Add each color the dress is available in. Customers will see swatches; selecting one swaps the gallery.</p>
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <Plus className="h-3.5 w-3.5" /> Add color
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No color variants yet. The default product images above will be shown.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="rounded-lg border border-border bg-cream p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={v.hex || "#000000"}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                  title="Swatch color"
                />
                <input
                  value={v.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Color name (e.g. Maroon)"
                  className="flex-1 min-w-[140px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={v.hex}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  placeholder="#hex"
                  className="w-24 rounded-lg border border-border bg-background px-2 py-2 text-xs font-mono"
                />
                <button type="button" onClick={() => remove(i)} className="rounded p-2 text-destructive hover:bg-secondary">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {v.images.map((src, idx) => (
                  <div key={idx} className="relative h-20 w-20">
                    <img src={src} alt="" className="h-full w-full rounded object-cover" />
                    <button type="button" onClick={() => update(i, { images: v.images.filter((_, k) => k !== idx) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border text-[10px] text-muted-foreground hover:border-primary hover:text-primary">
                  {uploadingIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /><span className="mt-1">Images</span></>}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(i, e.target.files)} disabled={uploadingIdx !== null} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
