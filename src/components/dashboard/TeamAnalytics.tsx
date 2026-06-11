import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Users, TrendingUp, History, Sparkles } from "lucide-react";
import { useTeamMembers, type TeamMember } from "@/hooks/useTeam";
import { TEAM_POSITIONS } from "@/lib/teamPositions";

// Neutral palette — keep gender data informative but visually balanced (no pink/blue stereotypes).
const C_F = "hsl(var(--primary))";
const C_M = "hsl(200 65% 50%)";
const NEUTRAL = "hsl(var(--muted-foreground))";

export function TeamAnalytics() {
  const { data: members = [], isLoading } = useTeamMembers();

  const stats = useMemo(() => {
    const years = Array.from(new Set(members.map((m) => m.year))).sort();
    const totals = { m: 0, f: 0, other: 0, unknown: 0 };
    for (const m of members) {
      if (m.gender === "m") totals.m++;
      else if (m.gender === "f") totals.f++;
      else if (m.gender === "other") totals.other++;
      else totals.unknown++;
    }
    const totalWithGender = totals.m + totals.f + totals.other;
    const femalePct = totalWithGender ? Math.round((totals.f / totalWithGender) * 100) : 0;
    const malePct = totalWithGender ? Math.round((totals.m / totalWithGender) * 100) : 0;

    // Gender per year (stacked)
    const perYear = years.map((y) => {
      const yMembers = members.filter((m) => m.year === y);
      return {
        year: String(y),
        Muški: yMembers.filter((m) => m.gender === "m").length,
        Ženski: yMembers.filter((m) => m.gender === "f").length,
        Ostalo: yMembers.filter((m) => m.gender === "other").length,
        total: yMembers.length,
      };
    });

    // Per position: balance label + history
    const perPosition = TEAM_POSITIONS.map((p) => {
      const list = members.filter((m) => m.position_key === p.key);
      const m = list.filter((x) => x.gender === "m").length;
      const f = list.filter((x) => x.gender === "f").length;
      const balance = m === f ? "Ravnopravno" : `${m} M · ${f} Ž`;
      return {
        key: p.key,
        name: p.short,
        Muški: m,
        Ženski: f,
        total: list.length,
        balance,
        history: list
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((x) => ({ year: x.year, name: x.name, gender: x.gender })),
      };
    }).filter((p) => p.total > 0);

    // Gender share over time — show both M and F for balance.
    const genderShare = perYear.map((y) => ({
      year: y.year,
      Muški: y.total ? Math.round((y["Muški"] / y.total) * 100) : 0,
      Ženski: y.total ? Math.round((y["Ženski"] / y.total) * 100) : 0,
    }));

    // Retention: members appearing in 2+ years
    const byName = new Map<string, Set<number>>();
    for (const m of members) {
      if (!byName.has(m.name)) byName.set(m.name, new Set());
      byName.get(m.name)!.add(m.year);
    }
    const returning = Array.from(byName.entries())
      .filter(([, yrs]) => yrs.size > 1)
      .map(([name, yrs]) => ({ name, years: Array.from(yrs).sort() }))
      .sort((a, b) => b.years.length - a.years.length);

    return {
      years, totals, totalWithGender, femalePct, malePct,
      perYear, perPosition, genderShare, returning,
      avgPerYear: years.length ? Math.round(members.length / years.length) : 0,
    };
  }, [members]);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Učitavanje analitike tima…</p>;
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Još nema članova tima.</p>;
  }

  const kpis = [
    { label: "Ukupno članova (svih generacija)", value: members.length, icon: Users },
    { label: "Generacija", value: stats.years.length, icon: History },
    { label: "Prosjek po godini", value: stats.avgPerYear, icon: TrendingUp },
    { label: "Rodna ravnoteža (M / Ž)", value: `${stats.malePct}% · ${stats.femalePct}%`, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Analitika tima</h2>
          <p className="text-xs text-muted-foreground">Trendovi kroz godine, pozicije i rodna struktura.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <k.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Rodna struktura po godinama</h3>
          <p className="text-xs text-muted-foreground mb-4">Broj članova po spolu u svakoj generaciji</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.perYear}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Muški" stackId="g" fill={C_M} radius={[0,0,0,0]} />
                <Bar dataKey="Ženski" stackId="g" fill={C_F} radius={[0,0,0,0]} />
                <Bar dataKey="Ostalo" stackId="g" fill={NEUTRAL} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Rodni udio kroz godine</h3>
          <p className="text-xs text-muted-foreground mb-4">Procenat muških i ženskih članova po generaciji</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.genderShare}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Muški" stroke={C_M} strokeWidth={2.5} dot={{ fill: C_M, r: 4 }} />
                <Line type="monotone" dataKey="Ženski" stroke={C_F} strokeWidth={2.5} dot={{ fill: C_F, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-1">Pozicije kroz historiju</h3>
        <p className="text-xs text-muted-foreground mb-4">Ukupan broj članova po poziciji, razvrstano po spolu</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.perPosition} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" className="text-xs" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={180} className="text-xs" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Muški" stackId="p" fill={C_M} />
              <Bar dataKey="Ženski" stackId="p" fill={C_F} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Historijat po poziciji</h3>
          <p className="text-xs text-muted-foreground mb-4">Hronološki — ko je sve bio na kojoj poziciji</p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {stats.perPosition.map((p) => (
              <div key={p.key} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {p.balance}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.history.map((h, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: h.gender === "f" ? C_F : h.gender === "m" ? C_M : "hsl(var(--border))",
                        color: h.gender === "f" ? C_F : h.gender === "m" ? C_M : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {h.year} · {h.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {stats.perPosition.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Dodaj pozicije članovima da bi se prikazalo.</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Veterani — više generacija</h3>
          <p className="text-xs text-muted-foreground mb-4">Članovi koji su bili u timu više od jedne godine</p>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {stats.returning.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Još nema povratnika.</p>
            )}
            {stats.returning.map((r) => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <div className="flex gap-1">
                  {r.years.map((y) => (
                    <span key={y} className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{y}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-1">Ukupna rodna struktura</h3>
        <p className="text-xs text-muted-foreground mb-4">Svi članovi kroz historiju</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Muški", value: stats.totals.m, fill: C_M },
                  { name: "Ženski", value: stats.totals.f, fill: C_F },
                  { name: "Ostalo", value: stats.totals.other, fill: NEUTRAL },
                  { name: "Nepoznato", value: stats.totals.unknown, fill: "hsl(var(--border))" },
                ].filter((d) => d.value > 0)}
                dataKey="value" nameKey="name" outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {[C_M, C_F, NEUTRAL, "hsl(var(--border))"].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}