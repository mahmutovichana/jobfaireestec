import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Building2, Mail, Phone, User } from "lucide-react";
import { useCreateInquiry } from "@/hooks/useInquiries";
import { toast } from "sonner";

const interestTypes = [
  { value: "participation", label: "Učešće na JobFAIR-u" },
  { value: "sponsorship", label: "Sponzorstvo" },
  { value: "media_partnership", label: "Medijsko partnerstvo" },
  { value: "other", label: "Ostalo" },
];

export default function Kontakt() {
  const createInquiry = useCreateInquiry();
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    message: "",
    interest_type: "participation",
  });
  const [submitted, setSubmitted] = useState(false);

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
      // Send confirmation email to the company
      const inquiryId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-inquiry-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `inquiry-confirm-${inquiryId}`,
          templateData: {
            company_name: form.company_name,
            contact_person: form.contact_person,
          },
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Greška pri slanju upita");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" />
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
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" /> Naziv kompanije *
              </Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                placeholder="Vaša kompanija d.o.o."
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Kontakt osoba *
              </Label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="Ime i prezime"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email *
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@kompanija.ba"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> Telefon
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+387 6x xxx xxx"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Vrsta interesovanja</Label>
              <Select value={form.interest_type} onValueChange={(v) => setForm((f) => ({ ...f, interest_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {interestTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Poruka *</Label>
              <Textarea
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
              <a href="mailto:chair@eestec-sa.ba" className="text-primary hover:underline">
                chair@eestec-sa.ba
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
