import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { prefetchRoute } from "@/lib/routePrefetch";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePendingRequestCount } from "@/hooks/useAccessRequests";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Newspaper,
  Megaphone,
  Handshake,
  UsersRound,
  Menu,
  Home,
  FileText,
  MessageSquare,
  ShieldCheck,
  ScrollText,
  Wallet,
} from "lucide-react";

const adminNavItems = [
  { title: "Početna", url: "/dashboard/home", icon: Home },
  { title: "Eventi", url: "/dashboard/events", icon: CalendarDays },
  { title: "Novosti", url: "/dashboard/news", icon: Newspaper },
  { title: "Oglasi", url: "/dashboard/job-ads", icon: Megaphone },
  { title: "Partneri", url: "/dashboard/partners", icon: Handshake },
  { title: "Tim", url: "/dashboard/team", icon: UsersRound },
  { title: "CV Baza", url: "/dashboard/cv-database", icon: FileText },
  { title: "Upiti", url: "/dashboard/company-inquiries", icon: MessageSquare },
  { title: "Analitika", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Audit log", url: "/dashboard/audit-logs", icon: ScrollText },
];

const companyNavItems = [
  { title: "Početna", url: "/dashboard/home", icon: Home },
  { title: "Moj profil", url: "/dashboard/settings", icon: Settings },
  { title: "CV Baza", url: "/dashboard/cv-database", icon: FileText },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { isAdmin } = useIsAdmin();
  // (board access no longer drives nav — finances are admin-only)
  // Only admins see the access-request badge, so don't fire the count query for everyone else.
  const { data: pendingCount = 0 } = usePendingRequestCount(isAdmin);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Defer scroll to the next frame so it doesn't force a synchronous layout
    // during route transition (avoids forced reflow during render).
    const id = requestAnimationFrame(() => mainRef.current?.scrollTo(0, 0));
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  let allItems: { title: string; url: string; icon: typeof Home }[];
  if (isAdmin) {
    // Insert "Zahtjevi" right after "Upiti" and before "Analitika".
    const items = [...adminNavItems];
    const upitiIdx = items.findIndex((i) => i.url === "/dashboard/company-inquiries");
    const insertAt = upitiIdx >= 0 ? upitiIdx + 1 : items.length;
    items.splice(insertAt, 0, { title: "Zahtjevi", url: "/dashboard/access-requests", icon: ShieldCheck });
    // Treasury for board members (admins always qualify)
    const analyticsIdx = items.findIndex((i) => i.url === "/dashboard/analytics");
    const treasuryAt = analyticsIdx >= 0 ? analyticsIdx : items.length;
    items.splice(treasuryAt, 0, { title: "Finansije", url: "/dashboard/treasury", icon: Wallet });
    allItems = items;
  } else {
    allItems = companyNavItems;
  }

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-14 flex items-center px-4 lg:px-6 gap-2 border-b border-border/50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" aria-label="Otvori navigaciju">
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" aria-label="Mobilna navigacija">
            <div className="p-4 border-b border-border/50">
              <Logo size="sm" />
            </div>
            <nav className="p-2 space-y-1" aria-label="Glavna navigacija">
              {allItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  onMouseEnter={() => prefetchRoute(item.url)}
                  onFocus={() => prefetchRoute(item.url)}
                  aria-current={isActive(item.url) ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.url)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  {item.title}
                  {item.url === "/dashboard/access-requests" && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto rounded-full text-xs px-1.5 py-0" aria-label={`${pendingCount} zahtjeva na čekanju`}>{pendingCount}</Badge>
                  )}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
              {user && <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>}
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Odjavi se
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/dashboard/home" className="mr-4 shrink-0" aria-label="JobFAIR početna">
          <Logo size="sm" />
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden lg:flex flex-1 items-center h-full overflow-x-auto">
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            {allItems.map((item) => (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  onMouseEnter={() => prefetchRoute(item.url)}
                  onFocus={() => prefetchRoute(item.url)}
                  className="relative px-3 py-1.5 text-sm font-medium text-foreground/70 rounded-full transition-colors hover:text-foreground hover:bg-muted whitespace-nowrap"
                  activeClassName="bg-foreground text-background hover:bg-foreground hover:text-background"
                >
                  {item.title}
                  {item.url === "/dashboard/access-requests" && pendingCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 rounded-full text-[10px] px-1 py-0 min-w-[18px] h-[18px] flex items-center justify-center" aria-label={`${pendingCount} zahtjeva na čekanju`}>{pendingCount}</Badge>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {user && <span className="text-xs text-muted-foreground hidden xl:block truncate max-w-[160px]">{user.email}</span>}
          <NavLink
            to="/dashboard/settings"
            className="p-2 text-muted-foreground rounded-full transition-colors hover:text-foreground hover:bg-muted"
            activeClassName="bg-foreground text-background hover:bg-foreground hover:text-background"
            aria-label="Postavke"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </NavLink>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={handleSignOut} aria-label="Odjavi se">
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <main ref={mainRef} className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
    </div>
  );
}
