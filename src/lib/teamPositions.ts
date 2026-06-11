export type Gender = "m" | "f" | "other";

export interface PositionDef {
  key: string;
  short: string;
  m: string;
  f: string;
}

export const TEAM_POSITIONS: PositionDef[] = [
  { key: "glavni_organizator", short: "Glavni organizator",
    m: "Glavni organizator", f: "Glavna organizatorica" },
  { key: "koord_pr", short: "Koordinator PR-a",
    m: "Koordinator tima za odnose s javnošću",
    f: "Koordinatorica tima za odnose s javnošću" },
  { key: "koord_fr", short: "Koordinator FR-a",
    m: "Koordinator tima za finansije",
    f: "Koordinatorica tima za finansije" },
  { key: "koord_it", short: "Koordinator IT-a",
    m: "Koordinator tima za informacione tehnologije",
    f: "Koordinatorica tima za informacione tehnologije" },
  { key: "koord_hr", short: "Koordinator HR-a i logistike",
    m: "Koordinator tima za ljudske resurse i logistiku",
    f: "Koordinatorica tima za ljudske resurse i logistiku" },
  { key: "koord_cr", short: "Koordinator CR-a",
    m: "Koordinator tima za odnose s kompanijama",
    f: "Koordinatorica tima za odnose s kompanijama" },
  { key: "koord_design", short: "Koordinator dizajna",
    m: "Koordinator tima za dizajn i publikacije",
    f: "Koordinatorica tima za dizajn i publikacije" },
];

export function positionLabel(key?: string | null, gender?: string | null): string {
  const p = TEAM_POSITIONS.find((x) => x.key === key);
  if (!p) return "";
  return gender === "f" ? p.f : p.m;
}

export function positionShort(key?: string | null): string {
  return TEAM_POSITIONS.find((x) => x.key === key)?.short ?? "";
}

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "m", label: "Muški" },
  { value: "f", label: "Ženski" },
  { value: "other", label: "Ostalo" },
];