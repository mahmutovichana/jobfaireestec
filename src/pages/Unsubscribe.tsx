import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid === false && d.reason === "already_unsubscribed") setStatus("already");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8"><Logo size="md" /></div>
        {status === "loading" && <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />}
        {status === "valid" && (
          <>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Odjava sa email liste</h1>
            <p className="text-muted-foreground mb-6">Da li ste sigurni da želite da se odjavite sa naših email obavještenja?</p>
            <Button onClick={handleUnsubscribe} disabled={submitting} className="rounded-full">
              {submitting ? "Obrađuje se..." : "Potvrdi odjavu"}
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Uspješno ste se odjavili</h1>
            <p className="text-muted-foreground">Nećete više primati email obavještenja od nas.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Već ste odjavljeni</h1>
            <p className="text-muted-foreground">Vaša email adresa je već uklonjena sa naše liste.</p>
          </>
        )}
        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Nevažeći link</h1>
            <p className="text-muted-foreground">Ovaj link za odjavu je nevažeći ili je istekao.</p>
          </>
        )}
      </div>
    </div>
  );
}
