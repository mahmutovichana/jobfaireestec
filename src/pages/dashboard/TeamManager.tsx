import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload, Search, Linkedin, Users } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import { useReorderItems } from "@/hooks/useReorder";
import {
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  uploadTeamPhoto,
  getPhotoStyle,
  type TeamMember,
} from "@/hooks/useTeam";
import { PhotoCropper } from "@/components/PhotoCropper";
import { TEAM_POSITIONS, GENDER_OPTIONS, positionLabel, positionShort } from "@/lib/teamPositions";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_COMMITTEE = "Organizacioni odbor";
const DEFAULT_EMAIL_DOMAIN = "@eestec-sa.ba";

const emptyForm = {
  name: "",
  role: "",
  committee: DEFAULT_COMMITTEE,
  photo_url: "",
  photo_crop: null as { x: number; y: number; zoom?: number } | null,
  linkedin_url: "",
  email: DEFAULT_EMAIL_DOMAIN,
  phone: "",
  display_order: 0,
  visible: true,
  year: CURRENT_YEAR,
  gender: "" as "" | "m" | "f" | "other",
  position_key: "" as string,
};

export default function TeamManager() {
  const { data: members = [], isLoading } = useTeamMembers();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const reorderTeam = useReorderItems("team_members", ["team-members"]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterYear, setFilterYear] = useState<number | "all">(CURRENT_YEAR);

  const years = useMemo(() => {
    const set = new Set<number>(members.map((m) => m.year));
    set.add(CURRENT_YEAR);
    return Array.from(set).sort((a, b) => b - a);
  }, [members]);

  const filtered = members
    .filter((m) => filterYear === "all" || m.year === filterYear)
    .filter((m) => filterPosition === "all" || m.position_key === filterPosition)
    .filter((m) => filterGender === "all" || m.gender === filterGender)
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const grouped = useMemo(() => {
    // Group by year so the user always sees the current generation first.
    const map = new Map<number, TeamMember[]>();
    for (const m of filtered) {
      const y = m.year ?? CURRENT_YEAR;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      committee: m.committee,
      photo_url: m.photo_url || "",
      photo_crop: m.photo_crop,
      linkedin_url: m.linkedin_url || "",
      email: m.email || "",
      phone: m.phone || "",
      display_order: m.display_order,
      visible: m.visible,
      year: m.year ?? CURRENT_YEAR,
      gender: (m.gender as any) || "",
      position_key: m.position_key || "",
    });
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadTeamPhoto(file);
      setForm((f) => ({ ...f, photo_url: url }));
    } catch (err: any) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const derivedRole = form.position_key
      ? positionLabel(form.position_key, form.gender || "m")
      : form.role;
    const payload = {
      ...form,
      role: derivedRole || form.role,
      gender: form.gender || null,
      position_key: form.position_key || null,
    };
    if (editing) {
      await updateMember.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMember.mutateAsync(payload as any);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Obrisati člana?")) return;
    await deleteMember.mutateAsync(id);
  };

  const handleDragEnd = (event: DragEndEvent, groupMembers: TeamMember[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groupMembers.findIndex((m) => m.id === active.id);
    const newIndex = groupMembers.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(groupMembers, oldIndex, newIndex);
    const groupIds = new Set(groupMembers.map((m) => m.id));
    const fullOrder = members.map((m) => m.id);
    let i = 0;
    const newFull = fullOrder.map((id) => (groupIds.has(id) ? reordered[i++].id : id));
    reorderTeam.mutate(newFull);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tim</h1>
          <p className="text-muted-foreground text-sm mt-1">Upravljajte članovima organizacionog odbora</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Sve pozicije" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve pozicije</SelectItem>
              {TEAM_POSITIONS.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.short}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Spol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi</SelectItem>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(v === "all" ? "all" : parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve godine</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Dodaj člana
        </Button>
      </div>

      {/* Year timeline */}
      {years.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterYear("all")}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
              filterYear === "all" ? "bg-foreground text-background border-foreground" : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
            }`}
          >
            Cijeli historijat
          </button>
          {years.map((y) => {
            const count = members.filter((m) => m.year === y).length;
            return (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-2 ${
                  filterYear === y ? "bg-foreground text-background border-foreground" : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
              >
                {y === CURRENT_YEAR && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {y}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nema rezultata</div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([groupYear, members]) => (
            <div key={groupYear}>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold text-foreground">
                  Generacija {groupYear}
                  {groupYear === CURRENT_YEAR && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Aktivna</span>
                  )}
                </h3>
                <Badge variant="secondary" className="text-xs">{members.length}</Badge>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, members)}
              >
                <SortableContext items={members.map((m) => m.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {members.map((member) => (
                      <SortableItem
                        key={member.id}
                        id={member.id}
                        as="div"
                        className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all"
                      >
                    <div className="aspect-square bg-muted/30 overflow-hidden">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" style={getPhotoStyle(member.photo_crop)} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground/30">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(member)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Visibility indicator */}
                    {!member.visible && (
                      <div className="absolute top-2 right-2 bg-destructive/80 text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                        Skriveno
                      </div>
                    )}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi člana" : "Dodaj člana"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-[180px_1fr] gap-6 pt-2">
            {/* Photo column */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Fotografija</Label>
              {form.photo_url ? (
                <PhotoCropper
                  imageUrl={form.photo_url}
                  value={form.photo_crop}
                  onChange={(crop) => setForm((f) => ({ ...f, photo_crop: crop }))}
                />
              ) : (
                <div className="w-[180px] h-[180px] rounded-2xl overflow-hidden bg-muted/40 border border-border/50 flex items-center justify-center">
                  <div className="text-3xl font-bold text-muted-foreground/40">
                    {form.name ? form.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() : "?"}
                  </div>
                </div>
              )}
              <label className="cursor-pointer block">
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Učitavanje..." : "Upload"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              <Input value={form.photo_url} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))} placeholder="ili URL slike" className="text-xs" />
            </div>

            {/* Fields column */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Ime i prezime *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ime Prezime" />
                </div>
                <div>
                  <Label>Spol</Label>
                  <Select value={form.gender || "__none"} onValueChange={(v) => setForm((f) => ({ ...f, gender: v === "__none" ? "" : (v as any) }))}>
                    <SelectTrigger><SelectValue placeholder="Odaberi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">—</SelectItem>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Pozicija</Label>
                  <Select value={form.position_key || "__none"} onValueChange={(v) => setForm((f) => ({ ...f, position_key: v === "__none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Odaberi poziciju" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— bez pozicije —</SelectItem>
                      {TEAM_POSITIONS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>{p.short}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Godina mandata</Label>
                  <Input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) || CURRENT_YEAR }))} />
                </div>
              </div>

              <div>
                <Label>Naziv prikaza</Label>
                <Input
                  value={form.position_key ? positionLabel(form.position_key, form.gender || "m") : form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="Automatski iz pozicije i spola, ili upiši ručno"
                  disabled={!!form.position_key}
                />
                {form.position_key && (
                  <p className="text-[11px] text-muted-foreground mt-1">Automatski generisano iz pozicije i spola.</p>
                )}
              </div>

              <div>
                <Label>LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." className="pl-9" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ime@eestec-sa.ba"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Predefinisano <code>@eestec-sa.ba</code> — slobodno prepiši bilo kojim drugim emailom.
                  </p>
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+387..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <Label>Redoslijed prikaza</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex items-center gap-3 h-10">
                  <Switch checked={form.visible} onCheckedChange={(v) => setForm((f) => ({ ...f, visible: v }))} />
                  <Label>Vidljiv na stranici</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSave} disabled={createMember.isPending || updateMember.isPending}>
              {editing ? "Sačuvaj" : "Dodaj"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
