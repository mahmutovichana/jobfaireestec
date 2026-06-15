import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { prefetchRoute } from "@/lib/routePrefetch";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_SCROLL_THRESHOLD, ROUTES } from "@/lib/constants";
import { Menu, Sun, Moon, X } from "lucide-react";
import { useTheme } from "next-themes";

interface NavItem {
  label: string;
  to: string;
}

interface PublicNavbarProps {
  items?: NavItem[];
  showRegister?: boolean;
}

const defaultItems: NavItem[] = [
  { label: "Aktivnosti", to: "/aktivnosti" },
  { label: "Novosti", to: ROUTES.NOVOSTI },
  { label: "Oglasi", to: ROUTES.OGLASI },
  { label: "Partneri", to: ROUTES.PARTNERI },
  { label: "Za kompanije", to: "/kontakt" },
  { label: "Prijava", to: ROUTES.AUTH },
];

export function PublicNavbar({ items = defaultItems, showRegister = true }: PublicNavbarProps) {
  const [navVisible, setNavVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Navbar is always visible across public pages for clearer navigation.
    setNavVisible(true);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-border/10"
      initial={{ y: -100 }}
      animate={{ y: navVisible ? 0 : -100 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[56px] sm:h-[64px] px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {items.map((item) => (
            <Button key={item.to} variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to={item.to} onMouseEnter={() => prefetchRoute(item.to)} onFocus={() => prefetchRoute(item.to)}>{item.label}</Link>
            </Button>
          ))}
          <Button
            aria-label="Promijeni temu"
            variant="ghost"
            size="icon"
            className="rounded-full ml-1"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {showRegister && (
            <Button className="text-sm font-semibold rounded-full ml-1" asChild>
              <Link to="/ostavi-cv" onMouseEnter={() => prefetchRoute("/ostavi-cv")} onFocus={() => prefetchRoute("/ostavi-cv")}>Ostavi CV</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1">
          <Button aria-label="Promijeni temu" variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Otvori meni" variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <Logo size="sm" />
              </div>
              <nav className="p-4 space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                {showRegister && (
                  <Link
                    to="/ostavi-cv"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    Ostavi CV
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
