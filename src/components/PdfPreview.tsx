import { useEffect, useRef, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfPreviewProps {
  url: string | null;
  pages?: number;
  scale?: number;
  className?: string;
}

/**
 * Renders the first N pages of a PDF to canvas using pdf.js.
 * Bypasses Chrome's PDF iframe restrictions since we render manually.
 */
export function PdfPreview({ url, pages = 1, scale = 1.0, className = "" }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const container = containerRef.current;
    container.innerHTML = "";

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url,
          disableAutoFetch: true,
          disableStream: false,
        });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const numPages = Math.min(pages, pdf.numPages);
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const viewport = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (i === 1) setLoading(false);
        }
        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Greška pri učitavanju PDF-a");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, pages, scale]);

  return (
    <div className={`relative w-full h-full bg-muted/30 overflow-auto ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm z-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Učitavanje pregleda...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FileText className="w-8 h-8 opacity-50" />
          <p className="text-xs">Nije moguće prikazati PDF</p>
        </div>
      )}
      <div ref={containerRef} className="space-y-2 p-2" />
    </div>
  );
}