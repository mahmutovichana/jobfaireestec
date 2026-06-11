import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        if (event === "SIGNED_IN" && session?.user) {
          // Defer to avoid deadlocks inside the auth callback
          setTimeout(() => verifyApproval(session.user), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyApproval = async (user: User) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      if (isAdmin) return;

      const { data: approved } = await supabase.rpc("is_email_approved", {
        check_email: user.email ?? "",
      });
      if (!approved) {
        await supabase.auth.signOut();
        toast.error(
          "Vaš nalog još nije odobren. Pošaljite zahtjev na stranici za prijavu ili sačekajte odobrenje administratora.",
          { duration: 7000 }
        );
      }
    } catch (e) {
      console.error("Approval check failed", e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
