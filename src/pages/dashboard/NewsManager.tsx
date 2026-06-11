import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useNewsPosts,
  useCreateNewsPost,
  useUpdateNewsPost,
  useDeleteNewsPost,
  uploadNewsImage,
  type NewsPost,
} from "@/hooks/useNews";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Upload,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";

const emptyForm = {
  title: "",
  summary: "",
  content: "",
  thumbnail_url: "",
  gallery_urls: [] as string[],
  published: false,
};

const NewsManager = () => {
  const { data: posts, isLoading } = useNewsPosts(false);
  const createPost = useCreateNewsPost();
  const updatePost = useUpdateNewsPost();
  const deletePost = useDeleteNewsPost();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleInstagramSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-instagram");
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message || "Instagram sync završen!");
      } else {
        toast.error(data?.error || "Sync nije uspio");
      }
    } catch (err: any) {
      toast.error("Greška pri syncu: " + err.message);
    }
    setSyncing(false);
  };

  const thumbnailRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (post: NewsPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      summary: post.summary || "",
      content: post.content || "",
      thumbnail_url: post.thumbnail_url || "",
      gallery_urls: post.gallery_urls,
      published: post.published,
    });
    setDialogOpen(true);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadNewsImage(file, "thumbnails");
      setForm((f) => ({ ...f, thumbnail_url: url }));
    } catch (err: any) {
      toast.error("Greška pri uploadu: " + err.message);
    }
    setUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadNewsImage(file, "gallery");
        urls.push(url);
      }
      setForm((f) => ({ ...f, gallery_urls: [...f.gallery_urls, ...urls] }));
    } catch (err: any) {
      toast.error("Greška pri uploadu: " + err.message);
    }
    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setForm((f) => ({
      ...f,
      gallery_urls: f.gallery_urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Naslov je obavezan");
      return;
    }

    if (editingId) {
      await updatePost.mutateAsync({ id: editingId, ...form });
    } else {
      await createPost.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const isSaving = createPost.isPending || updatePost.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Novosti
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upravljajte vijestima i obavještenjima
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleInstagramSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Instagram
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova novost
          </Button>
        </div>
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
      ) : posts?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-2">
            Nema novosti
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Kreirajte prvu novost klikom na dugme iznad
          </p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova novost
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts?.map((post) => (
            <div
              key={post.id}
              className="flex gap-4 bg-card rounded-xl p-4 border border-border hover:shadow-sm transition-shadow"
            >
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="w-24 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(post.created_at), "dd.MM.yyyy")}
                      {post.gallery_urls.length > 0 && (
                        <span className="ml-2">
                          📸 {post.gallery_urls.length} slika
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        post.published
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.published ? "Objavljeno" : "Draft"}
                    </span>
                  </div>
                </div>
                {post.summary && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {post.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {post.published && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link to={`/novost/${post.id}`} target="_blank">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(post)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Obrisati novost?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ova akcija se ne može poništiti.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Otkaži</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePost.mutate(post.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Uredi novost" : "Nova novost"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-2">
            {/* Left: text content */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Naslov *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Naslov novosti"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="summary">Kratak opis</Label>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Kratki sažetak koji se prikazuje na listi"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Sadržaj</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Puni tekst novosti..."
                  rows={12}
                />
              </div>
            </div>

            {/* Right: media + publish */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Thumbnail slika</Label>
                {form.thumbnail_url ? (
                  <div className="relative">
                    <img
                      src={form.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setForm((f) => ({ ...f, thumbnail_url: "" }))}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={thumbnailRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <button
                      onClick={() => thumbnailRef.current?.click()}
                      disabled={uploading}
                      className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-xs font-medium">Upload thumbnail</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Galerija slika</Label>
                <div className="grid grid-cols-3 gap-2">
                  {form.gallery_urls.map((url, i) => (
                    <div key={i} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Galerija ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeGalleryImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div>
                    <input
                      ref={galleryRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                    <button
                      onClick={() => galleryRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span className="text-[10px] font-medium">Dodaj</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <Label className="font-semibold">Objavi</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Objavljene novosti su vidljive svima
                  </p>
                </div>
                <Switch
                  checked={form.published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Otkaži
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? "Sačuvaj" : "Kreiraj"}
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManager;
