import { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Search,
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
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  const availableYears = useMemo(() => {
    const years = new Set((posts ?? []).map(p => new Date(p.created_at).getFullYear().toString()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.summary ?? "").toLowerCase().includes(q) ||
        (p.content ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter(p => (statusFilter === "published" ? p.published : !p.published));
    }
    if (yearFilter !== "all") {
      list = list.filter(p => new Date(p.created_at).getFullYear().toString() === yearFilter);
    }
    return [...list].sort((a, b) => {
      if (sortBy === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [posts, search, statusFilter, yearFilter, sortBy]);

  const handleInstagramSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-instagram");
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message || "Instagram sync završen!");
        queryClient.invalidateQueries({ queryKey: ["news-posts"] });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Novosti
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upravljajte vijestima i obavještenjima
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleInstagramSync} disabled={syncing} className="flex-1 sm:flex-none">
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Instagram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setSyncing(true);
              try {
                const { data, error } = await supabase.functions.invoke("backfill-news-images");
                if (error) throw error;
                if (data?.success) {
                  toast.success(`Migrirano ${data.images_migrated} slika u ${data.posts_updated} novosti`);
                  queryClient.invalidateQueries({ queryKey: ["news-posts"] });
                } else {
                  toast.error(data?.error || "Backfill nije uspio");
                }
              } catch (err: any) {
                toast.error("Greška: " + err.message);
              }
              setSyncing(false);
            }}
            disabled={syncing}
            className="flex-1 sm:flex-none"
            title="Spasi sve Instagram slike u trajno skladište"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Spasi IG slike
          </Button>
          <Button onClick={openCreate} size="sm" className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Nova novost
          </Button>
        </div>
      </div>

      {/* Filters */}
      {posts && posts.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-3 flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Pretraži novosti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-full text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-36 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi statusi</SelectItem>
              <SelectItem value="published">Objavljeno</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve godine</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40 rounded-full h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnovije</SelectItem>
              <SelectItem value="oldest">Najstarije</SelectItem>
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
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-2">
            {posts && posts.length > 0 ? "Nema rezultata" : "Nema novosti"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {posts && posts.length > 0 ? "Pokušajte drugačije filtere" : "Kreirajte prvu novost klikom na dugme iznad"}
          </p>
          {(!posts || posts.length === 0) && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Nova novost
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <span
                  className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                    post.published
                      ? "bg-success/90 text-success-foreground"
                      : "bg-background/80 text-muted-foreground border border-border"
                  }`}
                >
                  {post.published ? "Objavljeno" : "Draft"}
                </span>
                {post.gallery_urls.length > 0 && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-full bg-background/80 backdrop-blur-md text-foreground">
                    📸 {post.gallery_urls.length}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col p-4">
                <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {post.summary}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(post.created_at), "dd.MM.yyyy")}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {post.published && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/novost/${post.id}`} target="_blank">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(post)}>
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
                          <AlertDialogTitle>Obrisati novost?</AlertDialogTitle>
                          <AlertDialogDescription>Ova akcija se ne može poništiti.</AlertDialogDescription>
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
                  className="resize-none"
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
                  className="resize-y min-h-[240px]"
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
