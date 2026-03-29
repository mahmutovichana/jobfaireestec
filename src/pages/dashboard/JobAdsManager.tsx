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
  Upload, Loader2, ExternalLink, Building2,
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
      ) : ads?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-2">Nema oglasa</h3>
          <p className="text-sm text-muted-foreground mb-6">Kreirajte prvi oglas klikom na dugme iznad</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Novi oglas
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads?.map((ad) => (
            <div key={ad.id} className="flex gap-4 bg-card rounded-xl p-4 border border-border hover:shadow-sm transition-shadow">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="w-24 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">{ad.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ad.company_name}
                      {ad.deadline && (
                        <span className="ml-2">• Do {format(new Date(ad.deadline), "dd.MM.yyyy")}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    ad.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {ad.published ? "Aktivan" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {ad.external_link && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={ad.external_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ad)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Uredi oglas" : "Novi oglas"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
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
              <Label htmlFor="ad-desc">Opis</Label>
              <Textarea id="ad-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Opis pozicije..." rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ad-deadline">Rok prijave</Label>
                <Input id="ad-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-link">Eksterni link</Label>
                <Input id="ad-link" value={form.external_link} onChange={(e) => setForm((f) => ({ ...f, external_link: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Slika</Label>
              {form.image_url ? (
                <div className="relative inline-block">
                  <img src={form.image_url} alt="Ad" className="h-32 rounded-lg object-cover" />
                  <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" onClick={() => imageRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload sliku
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div>
                <Label className="font-semibold">Objavi</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Objavljeni oglasi su vidljivi svima</p>
              </div>
              <Switch checked={form.published} onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Sačuvaj" : "Kreiraj"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobAdsManager;
