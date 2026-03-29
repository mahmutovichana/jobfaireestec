import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Building2, Mail, Phone, User, Calendar, MessageSquare } from "lucide-react";
import { useInquiries, useUpdateInquiryStatus, type CompanyInquiry } from "@/hooks/useInquiries";
import { format } from "date-fns";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  new: "Novi",
  in_progress: "U obradi",
  contacted: "Kontaktirani",
  confirmed: "Potvrđeni",
  rejected: "Odbijeni",
};

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  contacted: "bg-blue-500/10 text-blue-500",
  confirmed: "bg-green-500/10 text-green-500",
  rejected: "bg-destructive/10 text-destructive",
};

const interestLabels: Record<string, string> = {
  participation: "Učešće",
  sponsorship: "Sponzorstvo",
  media_partnership: "Medijsko partnerstvo",
  presentation: "Prezentacija",
  other: "Ostalo",
};

export default function CompanyInquiries() {
  const { data: inquiries = [], isLoading } = useInquiries();
  const updateStatus = useUpdateInquiryStatus();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<CompanyInquiry | null>(null);

  const filtered = inquiries
    .filter((i) => filterStatus === "all" || i.status === filterStatus)
    .filter(
      (i) =>
        i.company_name.toLowerCase().includes(search.toLowerCase()) ||
        i.contact_person.toLowerCase().includes(search.toLowerCase()) ||
        i.email.toLowerCase().includes(search.toLowerCase())
    );

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
    toast.success("Status ažuriran");
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Upiti kompanija</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prijave kompanija za učešće na JobFAIR-u ({inquiries.length} ukupno)
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Svi statusi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nema upita</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-4"
              onClick={() => setSelected(inquiry)}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{inquiry.company_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{inquiry.contact_person} · {inquiry.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="text-[10px]">
                  {interestLabels[inquiry.interest_type] || inquiry.interest_type}
                </Badge>
                <Badge className={`text-[10px] border-0 ${statusColors[inquiry.status] || ""}`}>
                  {statusLabels[inquiry.status] || inquiry.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
                  {format(new Date(inquiry.created_at), "dd.MM.yyyy")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalji upita</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selected.company_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selected.contact_person}</span>
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
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{format(new Date(selected.created_at), "dd.MM.yyyy HH:mm")}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Poruka</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div>
                <span className="text-sm font-medium mb-2 block">Status</span>
                <Select value={selected.status} onValueChange={(v) => handleStatusChange(selected.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 rounded-full" asChild>
                  <a href={`mailto:${selected.email}`}>Odgovori emailom</a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
