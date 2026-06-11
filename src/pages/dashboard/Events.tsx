import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, CalendarDays, Users, Loader2, MapPin, ExternalLink, LayoutGrid, List, Trash2 } from "lucide-react";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { useRegistrations } from "@/hooks/useRegistrations";
import { format } from "date-fns";
import { toast } from "sonner";
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

import { EVENT_STATUS_COLORS } from "@/lib/constants";

const Events = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const { data: events, isLoading } = useEvents(search || undefined);
  const { data: registrations } = useRegistrations();
  const deleteEvent = useDeleteEvent();

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(`Event "${name}" obrisan.`);
    } catch (e: any) {
      toast.error("Greška pri brisanju: " + (e?.message || ""));
    }
  };

  const DeleteEventButton = ({ id, name, variant = "icon" }: { id: string; name: string; variant?: "icon" | "button" }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {variant === "icon" ? (
          <button
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-card/95 backdrop-blur-sm shadow-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            aria-label="Obriši event"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Button variant="outline" size="sm" className="text-xs rounded-full text-destructive hover:text-destructive">
            <Trash2 className="w-3 h-3 mr-1" /> Obriši
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Obrisati event "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Ova akcija je nepovratna. Svi podaci o registracijama za ovaj event ostaju u bazi, ali event neće više biti dostupan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Otkaži</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDelete(id, name)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Obriši
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const regCounts: Record<string, number> = {};
  registrations?.forEach((r) => {
    regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
  });

  const filtered = events?.filter(e => statusFilter === "all" || e.status === statusFilter);

  // Upcoming events: future-dated, sorted by date, take first 4
  const upcoming = events
    ?.filter(e => e.event_date && new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 4);

  const EventCard = ({ event, variant = "default" }: { event: NonNullable<typeof events>[number]; variant?: "default" | "upcoming" }) => {
    const count = regCounts[event.id] || 0;
    const isUpcoming = variant === "upcoming";

    return (
      <div
        className="group cursor-pointer relative"
        onClick={() => navigate(`/dashboard/events/${event.id}`)}
      >
        <DeleteEventButton id={event.id} name={event.name} />
        {/* Image */}
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-3">
          {event.background_image_url ? (
            <img
              src={event.background_image_url}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Price / status badge */}
          <div className="absolute top-3 left-3">
            {event.ticket_price && event.ticket_price > 0 ? (
              <span className="bg-card text-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                ${event.ticket_price}
              </span>
            ) : (
              <span className="bg-card text-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                Besplatno
              </span>
            )}
          </div>
        </div>
        {/* Info below image */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {event.event_date ? format(new Date(event.event_date), "EEE, d. MMM") : "Datum nije postavljen"}
            </p>
            {!isUpcoming && (
              <Badge className={`${EVENT_STATUS_COLORS[event.status] || "bg-muted text-muted-foreground"} border-0 capitalize text-[10px]`}>
                {event.status}
              </Badge>
            )}
          </div>
          <h3 className="font-display font-bold text-base leading-snug group-hover:text-primary transition-colors">
            {event.name}
          </h3>
          {!isUpcoming && (
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{count} prijavljenih</span>
              {event.location_value && (
                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{event.location_value}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Eventi</h1>
          <p className="text-muted-foreground">Kreiraj i upravljaj registracijskim stranicama događaja.</p>
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link to="/dashboard/events/create">
            <Plus className="w-4 h-4 mr-2" /> Novi event
          </Link>
        </Button>
      </div>

      {/* Upcoming Events Row */}
      {upcoming && upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Nadolazeći</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} variant="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pretraži evente…" className="pl-10 rounded-full" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="draft">Nacrt</SelectItem>
            <SelectItem value="live">Aktivni</SelectItem>
            <SelectItem value="past">Prošli</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex bg-muted rounded-full p-1 sm:ml-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-colors ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered && filtered.length > 0 ? (
        viewMode === "list" ? (
          /* LIST VIEW — borderless horizontal cards */
          <div className="space-y-6">
            {filtered.map((event) => {
              const count = regCounts[event.id] || 0;
              const shortDesc = event.description
                ? event.description.replace(/[*#_~`>]/g, "").split(/(?<=\.)\s+/).filter(Boolean).slice(0, 2).join(" ").slice(0, 250)
                : "";

              return (
                <div
                  key={event.id}
                  className="group flex flex-col sm:flex-row gap-4 cursor-pointer"
                  onClick={() => navigate(`/dashboard/events/${event.id}`)}
                >
                  <div className="sm:w-56 flex-shrink-0 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                    {event.background_image_url ? (
                      <img src={event.background_image_url} alt={event.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarDays className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {event.event_date ? format(new Date(event.event_date), "EEE, d. MMM") : "Datum nije postavljen"}
                      </p>
                      <Badge className={`${EVENT_STATUS_COLORS[event.status] || "bg-muted text-muted-foreground"} border-0 capitalize text-[10px]`}>
                        {event.status}
                      </Badge>
                    </div>
                    <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors">{event.name}</h3>
                    {shortDesc && <p className="text-sm text-muted-foreground line-clamp-2">{shortDesc}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{count} prijavljenih</span>
                      {event.location_value && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location_value}</span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="text-xs rounded-full" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to={`/register/${event.slug}`}><ExternalLink className="w-3 h-3 mr-1" />Otvori stranicu</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs rounded-full" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to={`/dashboard/events/${event.id}`}>Uredi</Link>
                      </Button>
                      <DeleteEventButton id={event.id} name={event.name} variant="button" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* GRID VIEW — lander-style cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Još nema evenata</h3>
          <p className="text-muted-foreground mb-4">Kreiraj prvi event da započneš.</p>
          <Button asChild>
            <Link to="/dashboard/events/create"><Plus className="w-4 h-4 mr-2" /> Novi event</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Events;
