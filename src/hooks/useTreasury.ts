import { useMemo } from "react";
import { usePartners, type PartnerPackage } from "@/hooks/usePartners";
import { usePackagePrices, type PackagePrice } from "@/hooks/usePackagePrices";

export interface YearBreakdown {
  year: number;
  total: number;
  currency: string;
  byPackage: Record<string, { count: number; price: number; revenue: number }>;
  partnerCount: number;
}

export function useTreasury() {
  const { data: partners = [], isLoading: lp } = usePartners();
  const { data: prices = [], isLoading: lpr } = usePackagePrices();

  const priceMap = useMemo(() => {
    const m = new Map<string, PackagePrice>();
    prices.forEach((p) => m.set(`${p.year}:${p.package}`, p));
    return m;
  }, [prices]);

  const breakdown = useMemo<YearBreakdown[]>(() => {
    const years = new Map<number, YearBreakdown>();
    partners.forEach((p) => {
      (p.participations ?? []).forEach((pp) => {
        if (!pp.package) return;
        const y = pp.year;
        if (!years.has(y)) {
          years.set(y, { year: y, total: 0, currency: "BAM", byPackage: {}, partnerCount: 0 });
        }
        const yb = years.get(y)!;
        const price = priceMap.get(`${y}:${pp.package}`);
        const amount = price ? Number(price.price) : 0;
        if (price?.currency) yb.currency = price.currency;
        if (!yb.byPackage[pp.package]) {
          yb.byPackage[pp.package] = { count: 0, price: amount, revenue: 0 };
        }
        yb.byPackage[pp.package].count += 1;
        yb.byPackage[pp.package].revenue += amount;
        yb.total += amount;
        yb.partnerCount += 1;
      });
    });
    return Array.from(years.values()).sort((a, b) => b.year - a.year);
  }, [partners, priceMap]);

  const grandTotal = breakdown.reduce((s, b) => s + b.total, 0);

  return { breakdown, grandTotal, prices, partners, isLoading: lp || lpr };
}

export const PACKAGE_PKG_LIST: PartnerPackage[] = ["gold", "silver", "standard", "promo"];