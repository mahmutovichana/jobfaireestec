import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { useFormFields } from "@/hooks/useFormFields";
import { useCreateRegistration } from "@/hooks/useRegistrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { bs } from "date-fns/locale";
import {
  CalendarDays, MapPin, Clock, Users, CheckCircle, ArrowRight, Radio,
  MessagesSquare, BookOpen, Handshake, Presentation, Lightbulb, Timer,
  CircleDot, Loader2, Mic,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEO } from "@/components/SEO";

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  webinar: { label: "Webinar / Podcast", icon: Radio },
  workshop: { label: "Radionica", icon: BookOpen },
  presentation: { label: "Prezentacija", icon: Presentation },
  panel: { label: "Panel diskusija", icon: CircleDot },
  networking: { label: "Networking / Razgovor", icon: Handshake },
  speed_dating: { label: "Career Speed Dating", icon: Timer },
  open_space: { label: "Open Space Technology", icon: Lightbulb },
  eestechat: { label: "EESTEChat", icon: MessagesSquare },
  other: { label: "Ostalo", icon: CalendarDays },
};

function RegistrationForm({ eventId, onSuccess }: { eventId: string; onSuccess: () => void }) {
  const { data: fields = [], isLoading } = useFormFields(eventId);
  const createReg = useCreateRegistration();
  const [values, setValues] = useState<Record<string, string>>({});

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter(f => f.required && !values[f.label]?.trim());
    if (missing.length > 0) {
      toast.error(`Molimo popunite: ${missing.map(m => m.label).join(", ")}`);
      return;
    }
    try {
      await createReg.mutateAsync({ event_id: eventId, data: values });
      toast.success("Uspješno ste se prijavili!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Greška pri prijavi.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.sort((a, b) => a.position - b.position).map(field => (
        <FormFieldRow key={field.id} field={field} value={values[field.label] || ""} onChange={v => setValues(prev => ({ ...prev, [field.label]: v }))} />
      ))}
      <Button type="submit" className="w-full rounded-full" disabled={createReg.isPending}>
        {createReg.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Prijavi se
      </Button>
    </form>
  );
}

function FormFieldRow({ field, value, onChange }: { field: any; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={field.field_type === "email" ? "email" : "text"}
        placeholder={field.placeholder || ""}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export default function Aktivnosti() {
  const { data: events = [], isLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = liveEvents
    .filter(e => e.event_date && new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime());
  const pastEvents = events
    .filter(e => e.status === "past" || (e.event_date && new Date(e.event_date) < new Date()))
    .sort((a, b) => new Date(b.event_date!).getTime() - new Date(a.event_date!).getTime());

  const handleRegSuccess = (eventId: string) => {
    setRegistered(prev => new Set(prev).add(eventId));
    setSelectedEvent(null);
  };

  const EventCard = ({ event }: { event: typeof liveEvents[0] }) => {
    const typeInfo = EVENT_TYPE_LABELS[event.event_type || "other"] || EVENT_TYPE_LABELS.other;
    const TypeIcon = typeInfo.icon;
    const isRegistered = registered.has(event.id);
    const isSelected = selectedEvent === event.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="overflow-hidden border-border/30 hover:border-primary/30 transition-all duration-300">
          {event.background_image_url && (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={event.background_image_url}
                alt={event.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full text-xs gap-1">
                <TypeIcon className="w-3 h-3" />
                {typeInfo.label}
              </Badge>
            </div>

            <h3 className="font-display font-bold text-lg leading-tight">{event.name}</h3>

            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description.replace(/[*#_~`>]/g, "").slice(0, 180)}
              </p>
            )}

            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {event.event_date && (
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  {format(new Date(event.event_date), "d. MMMM yyyy.", { locale: bs })}
                  {event.event_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(event.event_date), "HH:mm")}
                    </span>
                  )}
                </span>
              )}
              {event.location_value && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {event.location_value}
                </span>
              )}
            </div>

            {isRegistered ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium pt-1">
                <CheckCircle className="w-4 h-4" />
                Prijavljeni ste!
              </div>
            ) : (
              <Button
                className="w-full rounded-full mt-2"
                variant={isSelected ? "outline" : "default"}
                onClick={() => setSelectedEvent(isSelected ? null : event.id)}
              >
                {isSelected ? "Zatvori" : "Prijavi se"}
                {!isSelected && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}

            <AnimatePresence>
              {isSelected && !isRegistered && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-border/50">
                    <RegistrationForm
                      eventId={event.id}
                      onSuccess={() => handleRegSuccess(event.id)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Aktivnosti — radionice, paneli i prezentacije"
        description="Prijavite se na radionice, predavanja, panele i networking aktivnosti JobFAIR-a u Sarajevu."
        path="/aktivnosti"
        jsonLd={upcomingEvents.length > 0 ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: upcomingEvents.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Event",
              name: e.name,
              startDate: e.event_date || undefined,
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              location: e.location_value ? {
                "@type": "Place",
                name: e.location_value,
              } : undefined,
              organizer: { "@type": "Organization", name: "EESTEC LC Sarajevo" },
            },
          })),
        } : undefined}
      />
      <PublicNavbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="rounded-full mb-4 text-xs px-4 py-1">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Aktivnosti
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Prijavite se na <span className="text-primary">aktivnosti</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Radionice, prezentacije, paneli i više — odaberite aktivnosti koje vas zanimaju i prijavite se direktno.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-muted rounded-full p-1">
                  <TabsTrigger value="upcoming" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Nadolazeće ({upcomingEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Prošle ({pastEvents.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming">
                <h2 className="sr-only">Nadolazeće aktivnosti</h2>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-medium">Trenutno nema aktivnosti</p>
                    <p className="text-sm mt-1">Nove aktivnosti će uskoro biti objavljene.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                <h2 className="sr-only">Prošle aktivnosti</h2>
                {pastEvents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Nema prošlih aktivnosti.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                    {pastEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
