import { Logo } from "@/components/Logo";
import { COPYRIGHT_TEXT, EESTEC_WEBSITE, EESTEC_ORG_NAME } from "@/lib/constants";

interface PublicFooterProps {
  showEestec?: boolean;
  className?: string;
}

export function PublicFooter({ showEestec = false, className = "" }: PublicFooterProps) {
  return (
    <footer className={`py-12 px-6 lg:px-8 border-t border-white/[0.06] ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="md" />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {showEestec && (
            <a
              href={EESTEC_WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {EESTEC_ORG_NAME}
            </a>
          )}
          <span>{COPYRIGHT_TEXT}</span>
        </div>
      </div>
    </footer>
  );
}
