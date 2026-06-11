import { useState, useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, CheckCircle2, FileText, LogOut } from "lucide-react";
import { useCreateCVSubmission, uploadCV } from "@/hooks/useCV";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

const faculties = [
  "Elektrotehnički fakultet",
  "Fakultet za saobraćaj i komunikacije",
  "Mašinski fakultet",
  "Građevinski fakultet",
  "Arhitektonski fakultet",
  "Prirodno-matematički fakultet",
  "Ekonomski fakultet",
  "Fakultet za kriminalistiku",
  "Ostalo",
];

const years = ["1", "2", "3", "4", "5", "Ostalo"];

export default function OstaviCV() {
  const { user, signOut } = useAuth();
  const createCV = useCreateCVSubmission();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const facultyId = useId();
  const facultyOtherId = useId();
  const yearId = useId();
  const yearOtherId = useId();
  const fileId = useId();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    faculty: "",
    year_of_study: "",
  });
  const [customFaculty, setCustomFaculty] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from Google profile
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || user.user_metadata?.full_name || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/ostavi-cv",
    });
    if (error) toast.error("Google prijava nije uspjela");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Molimo priložite svoj CV (PDF)"); return; }
    if (!form.full_name.trim() || !form.email.trim()) { toast.error("Ime i email su obavezni"); return; }

    const finalFaculty = form.faculty === "Ostalo" ? (customFaculty.trim() || "Ostalo") : form.faculty;
    const finalYear = form.year_of_study === "Ostalo" ? (customYear.trim() || "Ostalo") : (form.year_of_study ? `${form.year_of_study}. godina` : null);

    setUploading(true);
    try {
      const cvPath = await uploadCV(file);
      await createCV.mutateAsync({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        faculty: finalFaculty || null,
        year_of_study: finalYear,
        cv_url: cvPath,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Greška pri slanju CV-a");
    }
    setUploading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SEO title="CV poslan — JobFAIR" description="Hvala! Vaš CV je uspješno priložen u bazu kandidata JobFAIR-a i bit će dostupan kompanijama učesnicama sajma zapošljavanja." path="/ostavi-cv" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">Hvala!</h1>
          <p className="text-muted-foreground mb-8">
            Vaš CV je uspješno priložen. Kompanije učesnice JobFAIR-a će moći pregledati vašu prijavu.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/">Nazad na početnu</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // If not signed in, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Ostavi CV"
          description="Studenti i diplomci — priložite svoj CV u bazu kompanija učesnica JobFAIR sajma zapošljavanja."
          path="/ostavi-cv"
        />
        <div className="border-b border-border/50">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Logo size="sm" />
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-3">
              Ostavi svoj <span className="text-primary">CV</span>
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Prijavite se putem Google računa kako biste priložili svoj CV.
            </p>
            <Button
              onClick={handleGoogleSignIn}
              className="rounded-full h-12 px-8 text-base font-semibold gap-3"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Prijavi se putem Google-a
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Koristi se isključivo za verifikaciju identiteta.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Ostavi CV"
        description="Priložite svoj CV i omogućite kompanijama učesnicama JobFAIR-a da vas pronađu."
        path="/ostavi-cv"
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
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Odjavi se
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
              Ostavi svoj <span className="text-primary">CV</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Priloži svoj CV i omogući kompanijama učesnicama da te pronađu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor={nameId} className="text-sm font-medium">Ime i prezime *</Label>
              <Input
                id={nameId}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Vaše ime i prezime"
                required
              />
            </div>

            <div>
              <Label htmlFor={emailId} className="text-sm font-medium">Email *</Label>
              <Input
                id={emailId}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="vas@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor={phoneId} className="text-sm font-medium">Telefon</Label>
              <Input
                id={phoneId}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+387 6x xxx xxx"
              />
            </div>

            <div>
              <Label htmlFor={facultyId} className="text-sm font-medium">Fakultet</Label>
              <Select value={form.faculty} onValueChange={(v) => setForm((f) => ({ ...f, faculty: v }))}>
                <SelectTrigger id={facultyId}><SelectValue placeholder="Odaberite fakultet" /></SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.faculty === "Ostalo" && (
                <Input
                  id={facultyOtherId}
                  aria-label="Naziv fakulteta"
                  className="mt-2"
                  value={customFaculty}
                  onChange={(e) => setCustomFaculty(e.target.value)}
                  placeholder="Unesite naziv fakulteta"
                />
              )}
            </div>

            <div>
              <Label htmlFor={yearId} className="text-sm font-medium">Godina studija</Label>
              <Select value={form.year_of_study} onValueChange={(v) => setForm((f) => ({ ...f, year_of_study: v }))}>
                <SelectTrigger id={yearId}><SelectValue placeholder="Odaberite godinu" /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y === "Ostalo" ? "Ostalo" : `${y}. godina`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.year_of_study === "Ostalo" && (
                <Input
                  id={yearOtherId}
                  aria-label="Godina studija"
                  className="mt-2"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="Unesite godinu studija (npr. Master, Diplomant)"
                />
              )}
            </div>

            <div>
              <Label htmlFor={fileId} className="text-sm font-medium">CV (PDF) *</Label>
              <label htmlFor={fileId} className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 transition-colors bg-muted/30">
                {file ? (
                  <div className="flex items-center gap-3 text-foreground">
                    <FileText className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Kliknite ili prevucite PDF fajl</span>
                  </>
                )}
                <input
                  id={fileId}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold"
              disabled={uploading || createCV.isPending}
            >
              {uploading ? "Učitavanje..." : "Pošalji CV"}
            </Button>
          </form>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
