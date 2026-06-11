import { useState, useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Building2, Mail, Phone, User, LogOut } from "lucide-react";
import { useCreateInquiry } from "@/hooks/useInquiries";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { SEO } from "@/components/SEO";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

const interestTypes = [
  { value: "participation", label: "Učešće na JobFAIR-u" },
  { value: "sponsorship", label: "Sponzorstvo" },
  { value: "media_partnership", label: "Medijsko partnerstvo" },
  { value: "other", label: "Ostalo" },
];

export default function Kontakt() {
  const { user, signOut } = useAuth();
  const createInquiry = useCreateInquiry();
  const companyId = useId();
  const contactId = useId();
  const emailId = useId();
  const phoneId = useId();
  const interestId = useId();
  const messageId = useId();
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    message: "",
    interest_type: "participation",
  });
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from Google profile
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        contact_person: f.contact_person || user.user_metadata?.full_name || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/kontakt",
    });
    if (error) toast.error("Google prijava nije uspjela");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.contact_person.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Molimo popunite sva obavezna polja");
      return;
    }

    try {
      await createInquiry.mutateAsync({
        ...form,
        phone: form.phone || null,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Greška pri slanju upita");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SEO title="Kontakt — upit poslan" description="Hvala! Vaš upit za učešće na JobFAIR sajmu je uspješno poslan timu — javit ćemo vam se uskoro sa svim potrebnim detaljima." path="/kontakt" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">Upit poslan!</h1>
          <p className="text-muted-foreground mb-8">
            Hvala na interesovanju. Naš tim će vas kontaktirati u najkraćem roku putem emaila.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/">Nazad na početnu</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show Google sign-in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Kontakt — za kompanije"
          description="Kontaktirajte tim JobFAIR-a — prijavite kompaniju za učešće, sponzorstvo ili medijsko partnerstvo."
          path="/kontakt"
        />
        <div className="border-b border-border/50">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Logo size="sm" />
          </div>
        </div>
        <div className="flex items-center justify-center px-4" style={{ minHeight: "calc(100vh - 65px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-3">
              Postanite <span className="text-primary">učesnik</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Prijavite se putem Google naloga kako biste poslali upit za učešće na JobFAIR-u.
            </p>
            <Button onClick={handleGoogleSignIn} className="rounded-full h-12 px-8 text-base font-semibold gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Prijavi se putem Google-a
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Kontakt — za kompanije"
        description="Pošaljite upit za učešće, sponzorstvo ili medijsko partnerstvo na JobFAIR sajmu zapošljavanja."
        path="/kontakt"
      />
      <PublicNavbar />
      <div className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Odjavi se" title="Odjavi se">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
              Postanite <span className="text-primary">učesnik</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Zainteresirani ste za učešće na JobFAIR-u? Ispunite formu i javit ćemo vam se.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor={companyId} className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" /> Naziv kompanije *
              </Label>
              <Input
                id={companyId}
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                placeholder="Vaša kompanija d.o.o."
                required
              />
            </div>

            <div>
              <Label htmlFor={contactId} className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Kontakt osoba *
              </Label>
              <Input
                id={contactId}
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="Ime i prezime"
                required
              />
            </div>

            <div>
              <Label htmlFor={emailId} className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email *
              </Label>
              <Input
                id={emailId}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@kompanija.ba"
                required
              />
            </div>

            <div>
              <Label htmlFor={phoneId} className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> Telefon
              </Label>
              <Input
                id={phoneId}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+387 6x xxx xxx"
              />
            </div>

            <div>
              <Label htmlFor={interestId} className="text-sm font-medium">Vrsta interesovanja</Label>
              <Select value={form.interest_type} onValueChange={(v) => setForm((f) => ({ ...f, interest_type: v }))}>
                <SelectTrigger id={interestId}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {interestTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={messageId} className="text-sm font-medium">Poruka *</Label>
              <Textarea
                id={messageId}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Opišite vaše interesovanje, veličinu štanda, broj predstavnika..."
                rows={5}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold"
              disabled={createInquiry.isPending}
            >
              {createInquiry.isPending ? "Šalje se..." : "Pošalji upit"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Takođe nas možete kontaktirati direktno na{" "}
              <a href="mailto:board@eestec-sa.ba" className="text-primary hover:underline">
                board@eestec-sa.ba
              </a>
            </p>
          </form>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
