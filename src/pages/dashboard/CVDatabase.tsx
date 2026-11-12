import { useState, useEffect, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Search, FileText, Download, Trash2, User, GraduationCap, Mail, Phone, Calendar, Eye } from "lucide-react";
import { useCVSubmissions, useDeleteCV, type CVSubmission } from "@/hooks/useCV";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const PdfPreview = lazyWithRetry(() =>
  import("@/components/PdfPreview").then(({ PdfPreview }) => ({ default: PdfPreview })),
);

function CVPreview({ cvUrl }: { cvUrl: string }) {
  const [signed, setSigned] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    api.storage.from("cv-uploads").createSignedUrl(cvUrl, 600).then(({ data }) => {
      if (!cancelled) setSigned(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [cvUrl]);

  const loading = <p className="p-4 text-sm text-muted-foreground">Učitavanje pregleda...</p>;
  if (signed === undefined) return loading;
  if (signed === null) return <p className="p-4 text-sm">Pregled CV-a nije dostupan.</p>;
  return <Suspense fallback={loading}><PdfPreview url={signed} /></Suspense>;
}

function CVHoverPreview({ cvUrl, children }: { cvUrl: string; children: React.ReactNode }) {
  return (
    <HoverCard openDelay={80} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-[440px] h-[580px] p-0 overflow-hidden rounded-2xl border-border/60 shadow-2xl"
      >
        <CVPreview key={cvUrl} cvUrl={cvUrl} />
      </HoverCardContent>
    </HoverCard>
  );
}

export default function CVDatabase() {
  const { data: submissions = [], isLoading } = useCVSubmissions();
  const deleteCV = useDeleteCV();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CVSubmission | null>(null);

  const filtered = submissions.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.faculty && s.faculty.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownload = async (cvUrl: string, name: string) => {
    try {
      const { data, error } = await api.storage
        .from("cv-uploads")
        .createSignedUrl(cvUrl, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error("Greška pri preuzimanju CV-a");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Obrisati ovaj CV?")) return;
    await deleteCV.mutateAsync(id);
    toast.success("CV obrisan");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">CV Baza</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pregled svih pristiglih CV-ova ({submissions.length} ukupno)
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži po imenu, emailu, fakultetu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nema rezultata</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cv) => (
            <CVHoverPreview key={cv.id} cvUrl={cv.cv_url}>
              <div
                className="group rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelected(cv)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleDownload(cv.cv_url, cv.full_name); }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(cv.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-medium text-foreground truncate">{cv.full_name}</h3>
                <p className="text-xs text-muted-foreground truncate">{cv.email}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {cv.faculty && <Badge variant="secondary" className="text-[10px]">{cv.faculty}</Badge>}
                  {cv.year_of_study && <Badge variant="outline" className="text-[10px]">{cv.year_of_study}</Badge>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-muted-foreground/60">
                    {format(new Date(cv.created_at), "dd.MM.yyyy HH:mm")}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                    <Eye className="w-3 h-3" /> Hover za pregled
                  </span>
                </div>
              </div>
            </CVHoverPreview>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalji prijave</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selected.full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline">{selected.email}</a>
              </div>
              {selected.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selected.phone}</span>
                </div>
              )}
              {selected.faculty && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selected.faculty}{selected.year_of_study ? ` — ${selected.year_of_study}` : ""}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{format(new Date(selected.created_at), "dd.MM.yyyy HH:mm")}</span>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-full gap-2"
                  onClick={() => handleDownload(selected.cv_url, selected.full_name)}
                >
                  <FileText className="w-4 h-4" /> Preuzmi CV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
