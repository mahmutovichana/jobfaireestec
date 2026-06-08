import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, Users, Calendar, Lock } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useBoardAccess } from "@/hooks/useBoardAccess";
import { useTreasury, PACKAGE_PKG_LIST } from "@/hooks/useTreasury";
import { usePackagePrices, useUpsertPackagePrice } from "@/hooks/usePackagePrices";
import { PACKAGE_LABELS, type PartnerPackage } from "@/hooks/usePartners";

const fmt = (n: number, currency = "BAM") =>
  `${n.toLocaleString("bs-BA", { maximumFractionDigits: 0 })} ${currency}`;

const PACKAGE_COLOR: Record<PartnerPackage, string> = {
  gold: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  silver: "bg-gray-400/15 text-gray-400 border-gray-400/30",
  standard: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  promo: "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

export default function Treasury() {
  const { isBoard, isLoading: laccess } = useBoardAccess();
  const { breakdown, grandTotal, partners, isLoading } = useTreasury();
  const { data: prices = [] } = usePackagePrices();
  const upsertPrice = useUpsertPackagePrice();

  const [editingYear, setEditingYear] = useState<number>(new Date().getFullYear());
  const [draft, setDraft] = useState<Record<string, string>>({});

  const priceFor = (year: number, pkg: PartnerPackage) =>
    prices.find((p) => p.year === year && p.package === pkg);

  const allYears = useMemo(() => {
    const set = new Set<number>([editingYear, new Date().getFullYear()]);
    breakdown.forEach((b) => set.add(b.year));
    prices.forEach((p) => set.add(p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [breakdown, prices, editingYear]);

  if (laccess) return <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>;
  if (!isBoard) return <Navigate to="/dashboard/home" replace />;

  const currentYearData = breakdown.find((b) => b.year === editingYear);
  const totalPartners = partners.length;
  const currency = breakdown[0]?.currency || "BAM";

  const savePrice = (year: number, pkg: PartnerPackage) => {
    const key = `${year}:${pkg}`;
    const v = parseFloat(draft[key] ?? "");
    if (isNaN(v)) return;
    upsertPrice.mutate({ year, package: pkg, price: v });
    setDraft((d) => {
      const n = { ...d };
      delete n[key];
      return n;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Finansije
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pregled prihoda od paketa partnera · UO pristup (@eestec-sa.ba + admini)
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Lock className="w-3 h-3" /> Privatno
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ukupni prihod (svi mandati)</p>
              <p className="text-2xl font-display font-bold">{fmt(grandTotal, currency)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ukupno partnera</p>
              <p className="text-2xl font-display font-bold">{totalPartners}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aktivne godine</p>
              <p className="text-2xl font-display font-bold">{breakdown.length}</p>
            </div>
          </div>
        </Card>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {breakdown.map((yb) => (
              <motion.div
                key={yb.year}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-5">
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
                  <div className="space-y-2">
                    {PACKAGE_PKG_LIST.map((pkg) => {
                      const data = yb.byPackage[pkg];
                      if (!data) return null;
                      return (
                        <div key={pkg} className="flex items-center justify-between text-sm border-t border-border/40 pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${PACKAGE_COLOR[pkg]} text-xs`}>
                              {PACKAGE_LABELS[pkg]}
                            </Badge>
                            <span className="text-muted-foreground">
                              {data.count}× × {fmt(data.price, yb.currency)}
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

      {/* Price editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold">Cijene paketa po godini</h2>
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingYear(Math.min(...allYears) - 1)}
              className="text-xs"
            >
              + Dodaj godinu
            </Button>
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
              {PACKAGE_PKG_LIST.map((pkg) => {
                const current = priceFor(editingYear, pkg);
                const key = `${editingYear}:${pkg}`;
                const value = draft[key] ?? (current?.price?.toString() ?? "");
                const dirty = draft[key] !== undefined && draft[key] !== (current?.price?.toString() ?? "");
                return (
                  <TableRow key={pkg}>
                    <TableCell>
                      <Badge variant="outline" className={PACKAGE_COLOR[pkg]}>{PACKAGE_LABELS[pkg]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                        placeholder="0"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{current?.currency ?? "BAM"}</TableCell>
                    <TableCell>
                      {dirty && (
                        <Button size="sm" onClick={() => savePrice(editingYear, pkg)} disabled={upsertPrice.isPending}>
                          Sačuvaj
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
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
                    const price = prices.find((pr) => pr.year === pp.year && pr.package === pp.package);
                    return (
                      <TableRow key={pp.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">{p.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={PACKAGE_COLOR[pp.package as PartnerPackage]}>
                            {PACKAGE_LABELS[pp.package as PartnerPackage]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {price ? fmt(Number(price.price), price.currency) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}