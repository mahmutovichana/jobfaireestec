import { Logo } from "@/components/Logo";
import { COPYRIGHT_TEXT, EESTEC_WEBSITE, EESTEC_ORG_NAME, JOBFAIR_SOCIALS } from "@/lib/constants";
import { Instagram, Linkedin, Facebook } from "lucide-react";

interface PublicFooterProps {
  showEestec?: boolean;
  className?: string;
}

export function PublicFooter({ showEestec = false, className = "" }: PublicFooterProps) {
  return (
    <footer className={`py-12 px-6 lg:px-8 border-t border-white/[0.06] ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          <a
            href={JOBFAIR_SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="JobFAIR Instagram"
            className="w-9 h-9 rounded-full bg-muted/40 hover:bg-primary/15 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href={JOBFAIR_SOCIALS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="JobFAIR LinkedIn"
            className="w-9 h-9 rounded-full bg-muted/40 hover:bg-primary/15 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href={JOBFAIR_SOCIALS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="JobFAIR Facebook"
            className="w-9 h-9 rounded-full bg-muted/40 hover:bg-primary/15 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
          >
            <Facebook className="w-4 h-4" />
          </a>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href={EESTEC_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {EESTEC_ORG_NAME}
          </a>
          <span>{COPYRIGHT_TEXT}</span>
        </div>
      </div>
    </footer>
  );
}
