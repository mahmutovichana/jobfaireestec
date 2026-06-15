import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { Info, Building2, ShieldAlert, Send, ArrowRight } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Access request form
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompanyName, setReqCompanyName] = useState("");
  const [reqCompanyDomain, setReqCompanyDomain] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserApproval(user.email || "");
    }
  }, [user]);

  const checkUserApproval = async (email: string) => {
    setCheckingApproval(true);
    
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id);
    
    const isAdmin = roles?.some(r => r.role === "admin");
    if (isAdmin) {
      navigate("/dashboard/home", { replace: true });
      setCheckingApproval(false);
      return;
    }

    const { data: approved } = await supabase.rpc("is_email_approved", { check_email: email });
    
    if (approved) {
      navigate("/dashboard/home", { replace: true });
    } else {
      await supabase.auth.signOut();
      toast.error("Vaš zahtjev za pristup još nije odobren. Molimo pošaljite zahtjev ili sačekajte odobrenje.", { duration: 6000 });
    }
    setCheckingApproval(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { 
      redirect_uri: `${window.location.origin}/auth`
    });
    if (error) toast.error(error.message || "Google prijava nije uspjela");
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("access_requests").insert({
        full_name: reqName.trim(),
        email: reqEmail.trim(),
        company_name: reqCompanyName || null,
        company_domain: reqCompanyDomain || null,
        message: reqMessage || null,
      });
      if (error) {
        console.error("Access request insert error:", error);
        toast.error(`Greška: ${error.message}`);
      } else {
        setRequestSent(true);
        toast.success("Zahtjev poslan! Obavijestit ćemo vas kad bude odobren.");
      }
    } catch (err: any) {
      console.error("Access request exception:", err);
      toast.error("Neočekivana greška. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingApproval) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Provjeravamo vaš pristup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] w-16 h-16 rounded-full bg-primary/10 blur-sm" />
        <div className="absolute top-[20%] right-[12%] w-12 h-12 rounded-lg bg-primary/8 rotate-12 blur-sm" />
        <div className="absolute bottom-[15%] left-[15%] w-10 h-10 rounded-full bg-primary/10 blur-sm" />
        <div className="absolute bottom-[25%] right-[8%] w-14 h-14 rounded-lg bg-primary/6 -rotate-12 blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <p className="text-muted-foreground mt-2 text-sm font-body">
            Platforma za kompanije i partnere
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* LEFT — Google Sign In */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 flex flex-col justify-center">
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="font-display font-bold text-lg text-foreground mb-1">Prijava</h2>
                <p className="text-xs text-muted-foreground">Za odobrene korisnike</p>
              </div>
              
              <Button
                variant="outline"
                className="w-full rounded-full h-12 font-medium text-base"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Prijavi se s Google računom
              </Button>

              <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Važno:</strong> Google prijava funkcionira samo nakon što admin tim odobri vaš zahtjev za pristup. Koristite email vaše organizacije za brže odobrenje.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Access Request */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            {requestSent ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Zahtjev poslan!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Obavijestit ćemo vas emailom nakon što admin tim pregleda i odobri zahtjev. Nakon odobrenja, prijavite se putem Google računa.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-1">
                  <h2 className="font-display font-bold text-lg text-foreground mb-1">Zahtjev za pristup</h2>
                  <p className="text-xs text-muted-foreground">Nemate pristup? Pošaljite zahtjev</p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
                  <div className="flex gap-2">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Koristite email vaše kompanije za brže odobrenje. Nakon odobrenja, prijavite se putem Google računa.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAccessRequest} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="req-name" className="text-xs font-medium">Ime i prezime *</Label>
                      <Input id="req-name" placeholder="Ime Prezime" required value={reqName} onChange={e => setReqName(e.target.value)} className="rounded-full h-9 px-3 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="req-email" className="text-xs font-medium">Email *</Label>
                      <Input id="req-email" type="email" placeholder="vas@firma.com" required value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="rounded-full h-9 px-3 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="req-company" className="text-xs font-medium">Naziv kompanije</Label>
                      <Input id="req-company" placeholder="Vaša kompanija" value={reqCompanyName} onChange={e => setReqCompanyName(e.target.value)} className="rounded-full h-9 px-3 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="req-domain" className="text-xs font-medium">Web domena</Label>
                      <Input id="req-domain" placeholder="firma.com" value={reqCompanyDomain} onChange={e => setReqCompanyDomain(e.target.value)} className="rounded-full h-9 px-3 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="req-message" className="text-xs font-medium">Poruka (opcionalno)</Label>
                    <Textarea id="req-message" placeholder="Zašto želite pristup..." value={reqMessage} onChange={e => setReqMessage(e.target.value)} className="rounded-xl px-3 min-h-[60px] resize-none text-sm" />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-10 font-medium text-sm" disabled={loading}>
                    {loading ? "Slanje…" : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Pošalji zahtjev
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Nastavkom pristajete na naše Uvjete korištenja i Politiku privatnosti.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
