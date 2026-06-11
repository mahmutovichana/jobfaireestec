import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PhotoCropper, type PhotoCrop } from "@/components/PhotoCropper";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Building2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_PLATFORMS, SOCIAL_ICON_URLS } from "@/lib/constants";
import { motion } from "framer-motion";

type SocialLink = { platform: string; url: string };

function generateCompanySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 6);
}

function isValidUrl(u: string): boolean {
  if (!u) return false;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return !!url.hostname && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function SocialIcon({ platform }: { platform: string }) {
  const url = SOCIAL_ICON_URLS[platform];
  if (!url) return <span className="w-4 h-4 rounded-sm bg-muted-foreground/40 inline-block" />;
  return (
    <img
      src={url.replace("/ffffff", "/64748b")}
      alt=""
      className="w-4 h-4 object-contain"
    />
  );
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [companySlug, setCompanySlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoCrop, setLogoCrop] = useState<PhotoCrop | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [tempCrop, setTempCrop] = useState<PhotoCrop | null>(null);
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name || "");
    setCompany(profile.company || "");
    setWebsite(profile.website || "");
    setCompanyDescription(profile.company_description || "");
    const links = profile.social_links;
    setSocialLinks(Array.isArray(links) ? links as SocialLink[] : []);
    setCompanySlug(profile.company_slug || "");
    setLogoUrl(profile.avatar_url || "");
    setLogoCrop(((profile as any).avatar_crop ?? null) as PhotoCrop | null);
    setInitialized(true);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Molimo odaberite sliku.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika (max 5MB).");
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      // Path must start with `logos/<user_id>/` to satisfy storage RLS
      const path = `logos/${user!.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("partner-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("partner-logos").getPublicUrl(path);
      setLogoUrl(publicUrl);
      setLogoCrop({ x: 50, y: 50, zoom: 1 });
      setTempCrop({ x: 50, y: 50, zoom: 1 });
      setCropOpen(true);
      toast.success("Logotip uploadovan! Podesi prikaz.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Greška pri uploadu logotipa");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error("Naziv kompanije je obavezan.");
      return;
    }
    // Validate social links (platform + valid URL)
    for (const link of socialLinks) {
      if (!link.platform || !link.url.trim()) {
        toast.error("Sve društvene mreže moraju imati platformu i link.");
        return;
      }
      if (!isValidUrl(link.url.trim())) {
        toast.error(`Neispravan link za ${link.platform}.`);
        return;
      }
    }

    try {
      const slug = companySlug || generateCompanySlug(company);
      
      // Save profile
      await updateProfile.mutateAsync({
        full_name: fullName,
        company,
        website,
        company_description: companyDescription,
        social_links: socialLinks as any,
        avatar_url: logoUrl,
        avatar_crop: logoCrop as any,
        company_slug: slug,
      } as any);
      
      if (!companySlug && slug) setCompanySlug(slug);

      // Also upsert a partner entry with visible=false for admin review
      const { data: existingPartner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existingPartner) {
        await supabase.from("partners").update({
          name: company,
          logo_url: logoUrl || null,
          website: website || null,
          description: companyDescription || null,
          visible: false, // Reset to pending on any edit
        }).eq("id", existingPartner.id);
      } else {
        await supabase.from("partners").insert({
          user_id: user!.id,
          name: company,
          logo_url: logoUrl || null,
          website: website || null,
          description: companyDescription || null,
          visible: false,
          category: "company" as const,
          package: "standard" as const,
        });
      }

      toast.success("Profil sačuvan! Vaše promjene će biti vidljive nakon odobrenja admin tima.");
    } catch (err: any) {
      toast.error(err.message || "Greška pri ažuriranju profila");
    }
  };

  const addSocialLink = () => setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };
  const removeSocialLink = (index: number) => setSocialLinks(socialLinks.filter((_, i) => i !== index));

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const logoObjectPosition = logoCrop ? `${logoCrop.x}% ${logoCrop.y}%` : "center";
  const logoTransform = logoCrop?.zoom && logoCrop.zoom !== 1 ? `scale(${logoCrop.zoom})` : undefined;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Profil kompanije</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Popunite informacije o vašoj kompaniji. Promjene će biti vidljive na stranici nakon odobrenja.
        </p>
      </motion.div>

      {/* Status indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card"
      >
        {company ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Profil u pregledu</p>
              <p className="text-xs text-muted-foreground">Admin tim će pregledati vaše podatke prije objave na stranici.</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Popunite profil</p>
              <p className="text-xs text-muted-foreground">Unesite podatke o vašoj kompaniji da se pojavi na listi partnera.</p>
            </div>
          </>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 space-y-5"
      >
        {/* Logo upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Logotip kompanije</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: logoObjectPosition, transform: logoTransform, transformOrigin: logoObjectPosition }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                <Building2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button variant="outline" size="sm" className="rounded-full" asChild disabled={uploading}>
                  <span>{uploading ? "Upload..." : logoUrl ? "Promijeni logo" : "Dodaj logo"}</span>
                </Button>
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => { setTempCrop(logoCrop ?? { x: 50, y: 50, zoom: 1 }); setCropOpen(true); }}
                  className="text-xs text-primary hover:underline text-left"
                >
                  Podesi zoom i poziciju
                </button>
              )}
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG. Preporučeno: 400x400px</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kontakt osoba *</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ime i prezime" className="rounded-full" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Naziv kompanije *</Label>
          <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Vaša kompanija d.o.o." className="rounded-full" />
        </div>

        <div className="space-y-2">
          <Label>Web stranica</Label>
          <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://vašastranica.com" className="rounded-full" />
        </div>

        <div className="space-y-2">
          <Label>Opis kompanije</Label>
          <Textarea
            value={companyDescription}
            onChange={e => setCompanyDescription(e.target.value)}
            placeholder="Kratki opis vaše kompanije, čime se bavite, šta nudite..."
            rows={4}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="mb-0">Društvene mreže</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addSocialLink} className="rounded-full h-8">
              <Plus className="w-4 h-4 mr-1" /> Dodaj mrežu
            </Button>
          </div>
          {socialLinks.map((link, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={link.platform} onValueChange={v => updateSocialLink(i, "platform", v)}>
                <SelectTrigger className="w-full sm:w-44 shrink-0 rounded-full">
                  <SelectValue placeholder="Platforma">
                    {link.platform && (
                      <span className="flex items-center gap-2">
                        <SocialIcon platform={link.platform} />
                        <span>{link.platform}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <SocialIcon platform={p} />
                        <span>{p}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={link.url}
                onChange={e => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://… (obavezno)"
                required
                type="url"
                className={`flex-1 rounded-full ${link.url && !isValidUrl(link.url) ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive self-end sm:self-auto" onClick={() => removeSocialLink(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-full w-full sm:w-auto">
          {updateProfile.isPending ? "Spremanje…" : "Sačuvaj profil kompanije"}
        </Button>
      </motion.div>

      {/* Logo crop dialog */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Podesi prikaz logotipa</DialogTitle>
          </DialogHeader>
          {logoUrl && (
            <div className="flex justify-center py-2">
              <PhotoCropper
                imageUrl={logoUrl}
                value={tempCrop}
                onChange={setTempCrop}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCropOpen(false)} className="rounded-full">Otkaži</Button>
            <Button
              onClick={() => { setLogoCrop(tempCrop); setCropOpen(false); toast.success("Prikaz spremljen — kliknite Sačuvaj profil."); }}
              className="rounded-full"
            >
              Spremi prikaz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
