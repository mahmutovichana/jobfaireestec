import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useJobAds,
  useCreateJobAd,
  useUpdateJobAd,
  useDeleteJobAd,
  uploadJobAdImage,
  type JobAd,
} from "@/hooks/useJobAds";
import {
  Plus, Pencil, Trash2, Image as ImageIcon, X, Eye,
  Upload, Loader2, ExternalLink, Building2, Search,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { usePartners } from "@/hooks/usePartners";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emptyForm = {
  title: "",
  description: "",
  company_name: "",
  deadline: "",
  image_url: "",
  external_link: "",
  published: false,
};

const JobAdsManager = () => {
  const { data: ads, isLoading } = useJobAds(false);
  const { data: partners = [] } = usePartners();
  const createAd = useCreateJobAd();
  const updateAd = useUpdateJobAd();
  const deleteAd = useDeleteJobAd();
  const companyNames = useMemo(() => {
    const set = new Set(partners.map((p) => p.name));
    return Array.from(set).sort();
  }, [partners]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "expired">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "deadline" | "title">("newest");

  const adCompanies = useMemo(() => {
    const set = new Set((ads ?? []).map(a => a.company_name));
    return Array.from(set).sort();
  }, [ads]);

  const filteredAds = useMemo(() => {
    let list = ads ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.company_name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter(a => {
        const expired = a.deadline && new Date(a.deadline) < new Date();
        if (statusFilter === "published") return a.published && !expired;
        if (statusFilter === "draft") return !a.published;
        if (statusFilter === "expired") return !!expired;
        return true;
      });
    }
    if (companyFilter !== "all") {
      list = list.filter(a => a.company_name === companyFilter);
    }
    return [...list].sort((a, b) => {
      if (sortBy === "deadline") {
        const ad = a.deadline ? +new Date(a.deadline) : Infinity;
        const bd = b.deadline ? +new Date(b.deadline) : Infinity;
        return ad - bd;
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [ads, search, statusFilter, companyFilter, sortBy]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ad: JobAd) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      description: ad.description || "",
      company_name: ad.company_name,
      deadline: ad.deadline ? ad.deadline.slice(0, 16) : "",
      image_url: ad.image_url || "",
      external_link: ad.external_link || "",
      published: ad.published,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadJobAdImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err: any) {
      toast.error("Greška pri uploadu: " + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company_name.trim()) {
      toast.error("Naslov i naziv firme su obavezni");
      return;
    }

    const payload = {
      ...form,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      image_url: form.image_url || undefined,
      external_link: form.external_link || undefined,
      description: form.description || undefined,
    };

    if (editingId) {
      await updateAd.mutateAsync({ id: editingId, ...payload });
    } else {
      await createAd.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const isSaving = createAd.isPending || updateAd.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Oglasi</h1>
          <p className="text-sm text-muted-foreground mt-1">Upravljajte oglasima za posao</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Novi oglas
        </Button>
      </div>

      {/* Filters */}
      {ads && ads.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-3 flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Pretraži oglase..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-full text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-36 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi statusi</SelectItem>
              <SelectItem value="published">Aktivni</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="expired">Istekli</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-44 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve firme</SelectItem>
              {adCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnovije</SelectItem>
              <SelectItem value="deadline">Po roku</SelectItem>
              <SelectItem value="title">Po naslovu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 bg-card rounded-xl p-4 border border-border">
              <div className="w-24 h-16 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-2">{ads && ads.length > 0 ? "Nema rezultata" : "Nema oglasa"}</h3>
          <p className="text-sm text-muted-foreground mb-6">{ads && ads.length > 0 ? "Pokušajte drugačije filtere" : "Kreirajte prvi oglas klikom na dugme iznad"}</p>
          {(!ads || ads.length === 0) && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Novi oglas
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAds.map((ad) => {
            const expired = ad.deadline && new Date(ad.deadline) < new Date();
            return (
              <div
                key={ad.id}
                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  {ad.image_url ? (
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <Building2 className="w-10 h-10 text-primary/40" />
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                    ad.published ? "bg-success/90 text-success-foreground" : "bg-background/80 text-muted-foreground border border-border"
                  }`}>
                    {ad.published ? "Aktivan" : "Draft"}
                  </span>
                  {expired && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur-md">
                      Istekao
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col p-4">
                  <p className="text-[11px] font-medium text-primary uppercase tracking-wide truncate">{ad.company_name}</p>
                  <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-snug mt-1">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{ad.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground">
                      {ad.deadline ? `Do ${format(new Date(ad.deadline), "dd.MM.yyyy")}` : "—"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {ad.external_link && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={ad.external_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ad)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Obrisati oglas?</AlertDialogTitle>
                            <AlertDialogDescription>Ova akcija se ne može poništiti.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Otkaži</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAd.mutate(ad.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Obriši
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Uredi oglas" : "Novi oglas"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-2">
            {/* Left column: main fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ad-title">Naslov *</Label>
                <Input id="ad-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Npr. Frontend Developer" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-company">Firma *</Label>
                {companyNames.length > 0 ? (
                  <Select value={form.company_name} onValueChange={(v) => setForm((f) => ({ ...f, company_name: v }))}>
                    <SelectTrigger><SelectValue placeholder="Odaberi kompaniju" /></SelectTrigger>
                    <SelectContent>
                      {companyNames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="ad-company" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} placeholder="Naziv kompanije" />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-desc">Opis pozicije</Label>
                <Textarea
                  id="ad-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Opišite poziciju, odgovornosti i tražene vještine..."
                  rows={14}
                  className="resize-y min-h-[260px]"
                />
              </div>
            </div>

            {/* Right column: meta + image + publish */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-deadline">Rok prijave</Label>
                  <Input id="ad-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-link">Eksterni link za prijavu</Label>
                  <Input id="ad-link" value={form.external_link} onChange={(e) => setForm((f) => ({ ...f, external_link: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Slika oglasa</Label>
                {form.image_url ? (
                  <div className="relative">
                    <img src={form.image_url} alt="Ad" className="w-full aspect-video object-cover rounded-lg" />
                    <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => imageRef.current?.click()}
                      disabled={uploading}
                      className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-xs font-medium">Upload sliku</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <Label className="font-semibold">Objavi</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Objavljeni oglasi su vidljivi svima</p>
                </div>
                <Switch checked={form.published} onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Sačuvaj" : "Kreiraj"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobAdsManager;
