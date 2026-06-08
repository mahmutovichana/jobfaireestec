import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Sun, Moon, Monitor, Copy, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { SOCIAL_PLATFORMS } from "@/lib/constants";

type SocialLink = { platform: string; url: string };

function generateCompanySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 6);
}

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [companySlug, setCompanySlug] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!profile || initialized) return;
    setFullName(profile.full_name || "");
    setCompany(profile.company || "");
    setWebsite((profile as any).website || "");
    setCompanyDescription((profile as any).company_description || "");
    const links = (profile as any).social_links;
    setSocialLinks(Array.isArray(links) ? links : []);
    setCompanySlug((profile as any).company_slug || "");
    setInitialized(true);
  }, [profile, initialized]);

  const handleSave = async () => {
    try {
      const slug = companySlug || (company ? generateCompanySlug(company) : undefined);
      await updateProfile.mutateAsync({
        full_name: fullName,
        company,
        website,
        company_description: companyDescription,
        social_links: socialLinks,
        ...(slug ? { company_slug: slug } : {}),
      } as any);
      if (slug) setCompanySlug(slug);
      toast.success("Profil ažuriran!");
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
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Postavke</h1>
        <p className="text-muted-foreground text-sm mt-1">Upravljajte svojim računom i preferencama.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-muted rounded-full p-1">
          <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Profil</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Izgled</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="bg-card rounded-xl p-4 sm:p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ime i prezime</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Organizacija / Kompanija</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label>Web stranica</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://vašastranica.com" className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label>Opis organizacije</Label>
              <Textarea
                value={companyDescription}
                onChange={e => setCompanyDescription(e.target.value)}
                placeholder="Kratki opis vaše organizacije…"
                rows={3}
                className="rounded-xl"
              />
            </div>

            {companySlug && (
              <div className="space-y-2">
                <Label>Javna stranica</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    value={`${window.location.origin}/company/${companySlug}`}
                    readOnly
                    className="flex-1 text-sm rounded-full"
                  />
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-full"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/company/${companySlug}`);
                        toast.success("Link kopiran!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <a href={`/company/${companySlug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="shrink-0 rounded-full">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}

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

            <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-full">
              {updateProfile.isPending ? "Spremanje…" : "Sačuvaj promjene"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <div className="bg-card rounded-xl p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="font-display font-semibold text-lg mb-1">Tema</h3>
              <p className="text-sm text-muted-foreground">Odaberite kako će aplikacija izgledati.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { value: "light", label: "Svijetla", icon: Sun, desc: "Čist i svijetli interfejs" },
                { value: "dark", label: "Tamna", icon: Moon, desc: "Ugodan za oči" },
                { value: "system", label: "Sistem", icon: Monitor, desc: "Prati postavke uređaja" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); toast.success(`Tema postavljena na: ${opt.label}`); }}
                  className={`relative flex flex-col items-center gap-3 rounded-xl p-6 transition-all cursor-pointer ${
                    theme === opt.value
                      ? "bg-muted ring-2 ring-foreground shadow-sm"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    theme === opt.value ? "bg-foreground text-background" : "bg-background text-muted-foreground"
                  }`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
