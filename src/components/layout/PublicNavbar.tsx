import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { NAV_SCROLL_THRESHOLD, ROUTES } from "@/lib/constants";

interface NavItem {
  label: string;
  to: string;
}

interface PublicNavbarProps {
  items?: NavItem[];
  showRegister?: boolean;
}

const defaultItems: NavItem[] = [
  { label: "Novosti", to: ROUTES.NOVOSTI },
  { label: "Oglasi", to: ROUTES.OGLASI },
  { label: "Prijava", to: ROUTES.AUTH },
];

export function PublicNavbar({ items = defaultItems, showRegister = true }: PublicNavbarProps) {
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > NAV_SCROLL_THRESHOLD);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-white/[0.06]"
      initial={{ y: -100 }}
      animate={{ y: navVisible ? 0 : -100 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[64px] px-6 lg:px-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <Button key={item.to} variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
          {showRegister && (
            <Button className="hidden sm:inline-flex text-sm font-semibold rounded-full" asChild>
              <Link to={ROUTES.AUTH}>Registracija</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
