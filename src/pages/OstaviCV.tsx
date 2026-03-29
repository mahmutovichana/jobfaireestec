import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, CheckCircle2, FileText } from "lucide-react";
import { useCreateCVSubmission, uploadCV } from "@/hooks/useCV";
import { toast } from "sonner";

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
  const createCV = useCreateCVSubmission();
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
              Ostavi svoj <span className="text-primary">CV</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Priloži svoj CV i omogući kompanijama učesnicama da te pronađu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Ime i prezime *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Vaše ime i prezime"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="vas@email.com"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+387 6x xxx xxx"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Fakultet</Label>
              <Select value={form.faculty} onValueChange={(v) => setForm((f) => ({ ...f, faculty: v }))}>
                <SelectTrigger><SelectValue placeholder="Odaberite fakultet" /></SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.faculty === "Ostalo" && (
                <Input
                  className="mt-2"
                  value={customFaculty}
                  onChange={(e) => setCustomFaculty(e.target.value)}
                  placeholder="Unesite naziv fakulteta"
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Godina studija</Label>
              <Select value={form.year_of_study} onValueChange={(v) => setForm((f) => ({ ...f, year_of_study: v }))}>
                <SelectTrigger><SelectValue placeholder="Odaberite godinu" /></SelectTrigger>
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
                  className="mt-2"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="Unesite godinu studija (npr. Master, Diplomant)"
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">CV (PDF) *</Label>
              <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 transition-colors bg-muted/30">
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
    </div>
  );
}
