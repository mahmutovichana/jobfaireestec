import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, Users, Calendar, Lock, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useTreasury } from "@/hooks/useTreasury";
import { usePackagePrices, useUpsertPackagePrice } from "@/hooks/usePackagePrices";
import { usePackageTypes, useUpsertPackageType, useDeletePackageType, type PackageType } from "@/hooks/usePackageTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const fmt = (n: number, currency = "BAM") =>
  `${n.toLocaleString("bs-BA", { maximumFractionDigits: 0 })} ${currency}`;

export default function Treasury() {
  const { isAdmin, isLoading: laccess } = useIsAdmin();
  const { breakdown, grandTotal, partners, isLoading } = useTreasury();
  const { data: prices = [] } = usePackagePrices();
  const { data: pkgTypes = [] } = usePackageTypes();
  const upsertPrice = useUpsertPackagePrice();
  const upsertType = useUpsertPackageType();
  const deleteType = useDeletePackageType();

  const [editingYear, setEditingYear] = useState<number>(new Date().getFullYear());
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [typeDialog, setTypeDialog] = useState<PackageType | null>(null);
  const [typeForm, setTypeForm] = useState<PackageType>({ key: "", label: "", color_class: "bg-muted text-foreground border-border", sort_order: 99, is_custom: false });

  const priceFor = (year: number, key: string) =>
    prices.find((p) => p.year === year && p.package === key);

  const allYears = useMemo(() => {
    const set = new Set<number>([editingYear, new Date().getFullYear()]);
    breakdown.forEach((b) => set.add(b.year));
    prices.forEach((p) => set.add(p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [breakdown, prices, editingYear]);

  if (laccess) return <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>;
  if (!isAdmin) return <Navigate to="/dashboard/home" replace />;

  const currentYearData = breakdown.find((b) => b.year === editingYear);
  const totalPartners = partners.length;
  const currency = breakdown[0]?.currency || "BAM";

  const savePrice = (year: number, key: string) => {
    const dk = `${year}:${key}`;
    const v = parseFloat(draft[dk] ?? "");
    if (isNaN(v)) return;
    upsertPrice.mutate({ year, package: key, price: v });
    setDraft((d) => {
      const n = { ...d };
      delete n[dk];
      return n;
    });
  };

  const openTypeDialog = (t?: PackageType) => {
    if (t) {
      setTypeForm(t);
      setTypeDialog(t);
    } else {
      const blank: PackageType = { key: "", label: "", color_class: "bg-muted text-foreground border-border", sort_order: (pkgTypes.at(-1)?.sort_order ?? 0) + 1, is_custom: false };
      setTypeForm(blank);
      setTypeDialog(blank);
    }
  };

  const saveType = async () => {
    if (!typeForm.key.trim() || !typeForm.label.trim()) return;
    await upsertType.mutateAsync({ ...typeForm, key: typeForm.key.trim().toLowerCase() });
    setTypeDialog(null);
  };

  const fixedTypes = pkgTypes.filter((t) => !t.is_custom);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Finansije
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pregled prihoda od paketa partnera · pristup samo administratori
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Lock className="w-3 h-3" /> Privatno
        </Badge>
      </div>

      {/* KPI cards — uniform height via items-stretch + h-full */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {[
          { icon: TrendingUp, label: "Ukupni prihod (svi mandati)", value: fmt(grandTotal, currency) },
          { icon: Users, label: "Ukupno partnera", value: String(totalPartners) },
          { icon: Calendar, label: "Aktivne godine", value: String(breakdown.length) },
        ].map((kpi, i) => (
          <Card key={i} className="p-5 h-full flex items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-display font-bold truncate">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Per-year breakdown */}
      <div>
        <h2 className="text-lg font-display font-bold mb-3">Prihod po godini</h2>
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Učitavanje...</div>
        ) : breakdown.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Još nema dodijeljenih paketa po godinama. Otvori <strong>Partneri</strong> tab i dodaj učešća.
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {breakdown.map((yb) => (
              <motion.div key={yb.year} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <Card className="p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-display font-bold">{yb.year}</h3>
                      <p className="text-xs text-muted-foreground">{yb.partnerCount} učesnika</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Prihod</p>
                      <p className="text-2xl font-display font-bold text-primary">{fmt(yb.total, yb.currency)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {pkgTypes.map((t) => {
                      const data = yb.byPackage[t.key];
                      if (!data) return null;
                      return (
                        <div key={t.key} className="flex items-center justify-between text-sm border-t border-border/40 pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${t.color_class} text-xs`}>{t.label}</Badge>
                            <span className="text-muted-foreground">
                              {data.count}× {t.is_custom ? "(custom)" : `× ${fmt(data.price, yb.currency)}`}
                            </span>
                          </div>
                          <span className="font-medium">{fmt(data.revenue, yb.currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Package types editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold">Tipovi paketa</h2>
          <Button size="sm" onClick={() => openTypeDialog()} className="gap-2"><Plus className="w-4 h-4" />Novi tip</Button>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naziv</TableHead>
                <TableHead>Ključ</TableHead>
                <TableHead>Custom</TableHead>
                <TableHead>Redoslijed</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pkgTypes.map((t) => (
                <TableRow key={t.key}>
                  <TableCell><Badge variant="outline" className={t.color_class}>{t.label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{t.key}</TableCell>
                  <TableCell className="text-xs">{t.is_custom ? "Da (cijena po partneru)" : "—"}</TableCell>
                  <TableCell className="text-xs">{t.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTypeDialog(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Obrisati paket "${t.label}"?`)) deleteType.mutate(t.key); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Price editor (only for non-custom types) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold">Cijene paketa po godini</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {allYears.map((y) => (
              <button
                key={y}
                onClick={() => setEditingYear(y)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  editingYear === y ? "bg-foreground text-background border-foreground" : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
              >
                {y}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setEditingYear(Math.min(...allYears) - 1)} className="text-xs">+ Dodaj godinu</Button>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket ({editingYear})</TableHead>
                <TableHead>Cijena</TableHead>
                <TableHead>Valuta</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedTypes.map((t) => {
                const current = priceFor(editingYear, t.key);
                const key = `${editingYear}:${t.key}`;
                const value = draft[key] ?? (current?.price?.toString() ?? "");
                const dirty = draft[key] !== undefined && draft[key] !== (current?.price?.toString() ?? "");
                return (
                  <TableRow key={t.key}>
                    <TableCell><Badge variant="outline" className={t.color_class}>{t.label}</Badge></TableCell>
                    <TableCell>
                      <Input type="number" value={value} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} placeholder="0" className="w-32" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{current?.currency ?? "BAM"}</TableCell>
                    <TableCell>
                      {dirty && <Button size="sm" onClick={() => savePrice(editingYear, t.key)} disabled={upsertPrice.isPending}>Sačuvaj</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <p className="text-xs text-muted-foreground mt-2">Custom paketi nemaju fiksnu cijenu — iznos se unosi za svaku godinu učešća kod partnera.</p>
      </div>

      {/* Detail table for active year */}
      {currentYearData && (
        <div>
          <h2 className="text-lg font-display font-bold mb-3">Partneri za {editingYear}</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Kategorija</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Iznos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners
                  .flatMap((p) =>
                    (p.participations ?? [])
                      .filter((pp) => pp.year === editingYear && pp.package)
                      .map((pp) => ({ p, pp }))
                  )
                  .map(({ p, pp }) => {
                    const t = pkgTypes.find((x) => x.key === pp.package);
                    const useCustom = t?.is_custom || pp.custom_price != null;
                    const price = prices.find((pr) => pr.year === pp.year && pr.package === pp.package);
                    const amount = useCustom ? Number(pp.custom_price ?? 0) : price ? Number(price.price) : 0;
                    const cur = useCustom ? (pp.currency || "BAM") : price?.currency || "BAM";
                    return (
                      <TableRow key={pp.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">{p.category}</TableCell>
                        <TableCell>
                          {t ? <Badge variant="outline" className={t.color_class}>{t.label}</Badge> : pp.package}
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(amount, cur)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Package type dialog */}
      <Dialog open={typeDialog !== null} onOpenChange={(o) => !o && setTypeDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{typeDialog && pkgTypes.find((t) => t.key === typeDialog.key) ? "Uredi paket" : "Novi paket"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Naziv (prikazani)</Label>
              <Input value={typeForm.label} onChange={(e) => setTypeForm((f) => ({ ...f, label: e.target.value }))} placeholder="npr. Platinasti" />
            </div>
            <div>
              <Label>Ključ (kratki identifikator, npr. "platinum")</Label>
              <Input value={typeForm.key} onChange={(e) => setTypeForm((f) => ({ ...f, key: e.target.value }))} placeholder="platinum" disabled={!!pkgTypes.find((t) => t.key === typeForm.key)} />
            </div>
            <div>
              <Label>CSS klase boje (Tailwind)</Label>
              <Input value={typeForm.color_class} onChange={(e) => setTypeForm((f) => ({ ...f, color_class: e.target.value }))} />
              <div className="mt-2"><Badge variant="outline" className={typeForm.color_class}>{typeForm.label || "Pregled"}</Badge></div>
            </div>
            <div>
              <Label>Redoslijed</Label>
              <Input type="number" value={typeForm.sort_order} onChange={(e) => setTypeForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={typeForm.is_custom} onCheckedChange={(v) => setTypeForm((f) => ({ ...f, is_custom: v }))} />
              <Label>Custom — cijena se unosi po svakom partneru/godini</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTypeDialog(null)}><X className="w-4 h-4 mr-1" />Otkaži</Button>
              <Button onClick={saveType} disabled={upsertType.isPending}><Check className="w-4 h-4 mr-1" />Sačuvaj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
