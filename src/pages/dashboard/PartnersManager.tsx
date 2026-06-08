import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink, Upload, Building2, Newspaper, Heart, Search } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import { useReorderItems } from "@/hooks/useReorder";
import { useAddParticipation, useDeleteParticipation, useUpdateParticipation } from "@/hooks/usePartnerParticipations";
import {
  usePartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  uploadPartnerLogo,
  PACKAGE_LABELS,
  PACKAGE_ORDER,
  CATEGORY_LABELS,
  type Partner,
  type PartnerCategory,
  type PartnerPackage,
} from "@/hooks/usePartners";

const CATEGORY_ICONS: Record<PartnerCategory, typeof Building2> = {
  company: Building2,
  media: Newspaper,
  sponsor: Heart,
};

const PACKAGE_COLORS: Record<PartnerPackage, string> = {
  gold: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  silver: "bg-gray-300/15 text-gray-300 border-gray-400/30",
  standard: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  promo: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const emptyForm = {
  name: "",
  logo_url: "",
  website: "",
  description: "",
  category: "company" as PartnerCategory,
  package: "standard" as PartnerPackage | null,
  display_order: 0,
  visible: true,
};

export default function PartnersManager() {
  const { data: partners = [], isLoading } = usePartners();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const reorderPartners = useReorderItems("partners", ["partners"]);
  const addParticipation = useAddParticipation();
  const updateParticipation = useUpdateParticipation();
  const deleteParticipation = useDeleteParticipation();
  const CURRENT_YEAR = new Date().getFullYear();
  const [newYear, setNewYear] = useState<number>(CURRENT_YEAR);
  const [newPkg, setNewPkg] = useState<PartnerPackage>("standard");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeTab, setActiveTab] = useState<PartnerCategory>("company");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = partners
    .filter((p) => p.category === activeTab)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Group companies by package
  const groupedByPackage = activeTab === "company"
    ? PACKAGE_ORDER.map((pkg) => ({
        pkg,
        label: PACKAGE_LABELS[pkg],
        partners: filtered.filter((p) => p.package === pkg),
      })).filter((g) => g.partners.length > 0)
    : [{ pkg: null as any, label: CATEGORY_LABELS[activeTab], partners: filtered }];

  const openCreate = () => {
    setEditingPartner(null);
    setForm({ ...emptyForm, category: activeTab, package: activeTab === "company" ? "standard" : null });
    setDialogOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setForm({
      name: partner.name,
      logo_url: partner.logo_url || "",
      website: partner.website || "",
      description: partner.description || "",
      category: partner.category,
      package: partner.package,
      display_order: partner.display_order,
      visible: partner.visible,
    });
    setDialogOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPartnerLogo(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch (err: any) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingPartner) {
      await updatePartner.mutateAsync({ id: editingPartner.id, ...form });
    } else {
      await createPartner.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Obrisati partnera?")) return;
    await deletePartner.mutateAsync(id);
  };

  const handlePackageChange = async (partnerId: string, newPackage: PartnerPackage) => {
    await updatePartner.mutateAsync({ id: partnerId, package: newPackage });
  };

  const handleDragEnd = (event: DragEndEvent, groupPartners: Partner[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groupPartners.findIndex((p) => p.id === active.id);
    const newIndex = groupPartners.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(groupPartners, oldIndex, newIndex);
    // Build full ordered list: keep other groups' order, replace this group with reordered
    const groupIds = new Set(groupPartners.map((p) => p.id));
    const fullOrder = partners.map((p) => p.id);
    // Replace ids in fullOrder that belong to this group with reordered ids in their slots
    let i = 0;
    const newFull = fullOrder.map((id) => (groupIds.has(id) ? reordered[i++].id : id));
    reorderPartners.mutate(newFull);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Partneri</h1>
          <p className="text-muted-foreground text-sm mt-1">Upravljajte kompanijama, medijima i sponzorima</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PartnerCategory)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            {(Object.keys(CATEGORY_LABELS) as PartnerCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = partners.filter((p) => p.category === cat).length;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  <Icon className="w-4 h-4" />
                  {CATEGORY_LABELS[cat]}
                  <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

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
            <Button onClick={openCreate} className="rounded-full gap-2">
              <Plus className="w-4 h-4" />
              Dodaj
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
          ) : groupedByPackage.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nema rezultata</div>
          ) : (
            <div className="space-y-8">
              {groupedByPackage.map((group) => (
                <div key={group.pkg ?? "all"}>
                  {activeTab === "company" && (
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={`${PACKAGE_COLORS[group.pkg]} text-sm px-3 py-1`}>
                        {group.label} paket
                      </Badge>
                      <span className="text-xs text-muted-foreground">{group.partners.length} kompanija</span>
                    </div>
                  )}

                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead className="w-16">Logo</TableHead>
                          <TableHead>Naziv</TableHead>
                          {activeTab === "company" && <TableHead>Paket</TableHead>}
                          <TableHead>Website</TableHead>
                          <TableHead className="w-20">Vidljiv</TableHead>
                          <TableHead className="w-28">Akcije</TableHead>
                        </TableRow>
                      </TableHeader>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, group.partners)}
                      >
                        <SortableContext items={group.partners.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                          <TableBody>
                            {group.partners.map((partner) => (
                              <SortableItem key={partner.id} id={partner.id} as="tr" className="border-b transition-colors hover:bg-muted/50">
                            <TableCell>
                              {partner.logo_url ? (
                                <img
                                  src={partner.logo_url}
                                  alt={partner.name}
                                  className="w-10 h-10 object-contain rounded-lg bg-muted/50 p-1"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground text-xs">
                                  {partner.name[0]}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{partner.name}</p>
                                {partner.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{partner.description}</p>
                                )}
                              </div>
                            </TableCell>
                            {activeTab === "company" && (
                              <TableCell>
                                <Select
                                  value={partner.package || "standard"}
                                  onValueChange={(v) => handlePackageChange(partner.id, v as PartnerPackage)}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PACKAGE_ORDER.map((pkg) => (
                                      <SelectItem key={pkg} value={pkg}>{PACKAGE_LABELS[pkg]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            )}
                            <TableCell>
                              {partner.website && (
                                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  Link
                                </a>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={partner.visible}
                                onCheckedChange={(v) => updatePartner.mutate({ id: partner.id, visible: v })}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(partner)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(partner.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                              </SortableItem>
                            ))}
                          </TableBody>
                        </SortableContext>
                      </DndContext>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPartner ? "Uredi partnera" : "Dodaj partnera"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Naziv *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Naziv kompanije" />
            </div>

            <div>
              <Label>Kategorija</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as PartnerCategory, package: v === "company" ? "standard" : null }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as PartnerCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.category === "company" && (
              <div>
                <Label>Paket</Label>
                <Select value={form.package || "standard"} onValueChange={(v) => setForm((f) => ({ ...f, package: v as PartnerPackage }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKAGE_ORDER.map((pkg) => (
                      <SelectItem key={pkg} value={pkg}>{PACKAGE_LABELS[pkg]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url && (
                  <img src={form.logo_url} alt="" className="w-12 h-12 object-contain rounded-lg bg-muted/50 p-1" />
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Učitavanje..." : "Upload logo"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
                {form.logo_url && (
                  <Input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="ili URL" className="flex-1" />
                )}
              </div>
              {!form.logo_url && (
                <Input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="Logo URL" className="mt-2" />
              )}
            </div>

            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
            </div>

            <div>
              <Label>Opis</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Kratak opis partnera" rows={3} />
            </div>

            <div>
              <Label>Redoslijed prikaza</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.visible} onCheckedChange={(v) => setForm((f) => ({ ...f, visible: v }))} />
              <Label>Vidljiv na javnoj stranici</Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
              <Button onClick={handleSave} disabled={createPartner.isPending || updatePartner.isPending}>
                {editingPartner ? "Sačuvaj" : "Dodaj"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
