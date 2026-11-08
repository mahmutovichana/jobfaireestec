export const oauth = {
  auth: {
    async signInWithOAuth(
      provider: string,
      options?: { redirect_uri?: string },
    ) {
      if (provider !== "google")
        return { error: new Error("Nepodržan način prijave") };
      const target = new URL(
        options?.redirect_uri ?? "/auth",
        window.location.origin,
      );
      if (target.origin !== window.location.origin)
        return { error: new Error("Neispravna povratna adresa") };
      const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(
        /\/$/,
        "",
      );
      try {
        const response = await fetch(base + "/auth/config");
        const config = await response.json();
        if (!response.ok || !config.data?.google)
          return {
            error: new Error(
              "Google prijava još nije konfigurirana na ovom serveru",
            ),
          };
      } catch {
        return { error: new Error("Servis za prijavu trenutno nije dostupan") };
      }
      window.location.assign(
        base +
          "/auth/google/start?returnTo=" +
          encodeURIComponent(target.pathname + target.search),
      );
      return { error: null };
    },
  },
};
