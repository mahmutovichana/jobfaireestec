import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Building2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import { motion } from "framer-motion";

type SocialLink = { platform: string; url: string };

function generateCompanySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 6);
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
    setInitialized(true);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${user!.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("partner-logos")
      .upload(path, file, { upsert: true });
    
    if (uploadError) {
      toast.error("Greška pri uploadu logotipa");
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("partner-logos")
      .getPublicUrl(path);
    
    setLogoUrl(publicUrl);
    setUploading(false);
    toast.success("Logotip uploadovan!");
  };

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error("Naziv kompanije je obavezan.");
      return;
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
        company_slug: slug,
      });
      
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
              <div className="w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                <Building2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button variant="outline" size="sm" className="rounded-full" asChild disabled={uploading}>
                  <span>{uploading ? "Upload..." : logoUrl ? "Promijeni logo" : "Dodaj logo"}</span>
                </Button>
              </label>
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
          <Label>Društvene mreže</Label>
          {socialLinks.map((link, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={link.platform} onValueChange={v => updateSocialLink(i, "platform", v)}>
                <SelectTrigger className="w-full sm:w-40 shrink-0 rounded-full">
                  <SelectValue placeholder="Platforma" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={link.url}
                onChange={e => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-full"
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive self-end sm:self-auto" onClick={() => removeSocialLink(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Dodaj mrežu
          </Button>
        </div>

        <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-full w-full sm:w-auto">
          {updateProfile.isPending ? "Spremanje…" : "Sačuvaj profil kompanije"}
        </Button>
      </motion.div>
    </div>
  );
}
