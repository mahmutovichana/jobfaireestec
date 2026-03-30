import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Newspaper,
  Megaphone,
  Handshake,
  UsersRound,
  Menu,
  Home,
  FileText,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { title: "Početna", url: "/dashboard/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Novosti", url: "/dashboard/news", icon: Newspaper },
  { title: "Oglasi", url: "/dashboard/job-ads", icon: Megaphone },
  { title: "Partneri", url: "/dashboard/partners", icon: Handshake },
  { title: "Tim", url: "/dashboard/team", icon: UsersRound },
  { title: "CV Baza", url: "/dashboard/cv-database", icon: FileText },
  { title: "Upiti", url: "/dashboard/company-inquiries", icon: MessageSquare },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const allItems = [
    ...navItems,
    ...(profile?.company_slug
      ? [{ title: "Kompanija", url: `/company/${profile.company_slug}`, icon: Eye }]
      : []),
  ];

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Desktop header */}
      <header className="h-14 flex items-center px-4 lg:px-6 gap-2 border-b border-border/50">
        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-4 border-b border-border/50">
              <Logo size="sm" />
            </div>
            <nav className="p-2 space-y-1">
              {allItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.url)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
              <Link
                to="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard/settings")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Settings className="w-4 h-4" />
                Postavke
              </Link>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
              {user && (
                <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
              )}
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Odjavi se
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/dashboard/home" className="mr-4 shrink-0">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex flex-1 items-center h-full overflow-x-auto">
          <div className="flex items-center gap-1">
            {allItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-full transition-colors hover:text-foreground hover:bg-muted whitespace-nowrap"
                activeClassName="bg-foreground text-background hover:bg-foreground hover:text-background"
                end={item.url === "/dashboard"}
              >
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {user && (
            <span className="text-xs text-muted-foreground hidden xl:block truncate max-w-[160px]">{user.email}</span>
          )}
          <NavLink
            to="/dashboard/settings"
            className="p-2 text-muted-foreground rounded-full transition-colors hover:text-foreground hover:bg-muted"
            activeClassName="bg-foreground text-background hover:bg-foreground hover:text-background"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <main ref={mainRef} className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
    </div>
  );
}
