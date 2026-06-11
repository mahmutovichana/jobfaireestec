import { useRef, useState, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export interface PhotoCrop {
  x: number;
  y: number;
  zoom?: number;
}

interface PhotoCropperProps {
  imageUrl: string;
  value?: PhotoCrop | null;
  onChange: (crop: PhotoCrop) => void;
}

const CONTAINER_SIZE = 180;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export function PhotoCropper({ imageUrl, value, onChange }: PhotoCropperProps) {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState<number>(value?.zoom ?? 1);
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgKeyRef = useRef(imageUrl);
  const [, forceRender] = useState(0);

  const baseScale =
    naturalSize.w > 0 && naturalSize.h > 0
      ? Math.max(CONTAINER_SIZE / naturalSize.w, CONTAINER_SIZE / naturalSize.h)
      : 1;
  const scale = baseScale * zoom;

  const rw = naturalSize.w * scale;
  const rh = naturalSize.h * scale;
  const overflowX = Math.max(0, rw - CONTAINER_SIZE);
  const overflowY = Math.max(0, rh - CONTAINER_SIZE);

  // Initialize offset from saved value whenever imageUrl or value changes
  useEffect(() => {
    if (imageUrl !== imgKeyRef.current) {
      imgKeyRef.current = imageUrl;
      setNaturalSize({ w: 0, h: 0 });
      setZoom(value?.zoom ?? 1);
    }

    const maxOX = overflowX / 2;
    const maxOY = overflowY / 2;
    const ox = overflowX > 0 ? (50 - (value?.x ?? 50)) * overflowX / 100 : 0;
    const oy = overflowY > 0 ? (50 - (value?.y ?? 50)) * overflowY / 100 : 0;
    currentOffsetRef.current = {
      x: Math.max(-maxOX, Math.min(maxOX, ox)),
      y: Math.max(-maxOY, Math.min(maxOY, oy)),
    };
    forceRender((n) => n + 1);
  }, [imageUrl, value, overflowX, overflowY]);

  const xPct =
    overflowX > 0
      ? Math.max(0, Math.min(100, 50 - (currentOffsetRef.current.x / (overflowX / 2)) * 50))
      : 50;
  const yPct =
    overflowY > 0
      ? Math.max(0, Math.min(100, 50 - (currentOffsetRef.current.y / (overflowY / 2)) * 50))
      : 50;

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      setDragging(true);
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        ox: currentOffsetRef.current.x,
        oy: currentOffsetRef.current.y,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const maxOX = overflowX / 2;
      const maxOY = overflowY / 2;
      currentOffsetRef.current = {
        x: Math.max(-maxOX, Math.min(maxOX, dragStartRef.current.ox + dx)),
        y: Math.max(-maxOY, Math.min(maxOY, dragStartRef.current.oy + dy)),
      };
      forceRender((n) => n + 1);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onUp = () => {
      setDragging(false);
      const maxOX = overflowX / 2;
      const maxOY = overflowY / 2;
      const finalX =
        overflowX > 0
          ? Math.max(0, Math.min(100, 50 - (currentOffsetRef.current.x / maxOX) * 50))
          : 50;
      const finalY =
        overflowY > 0
          ? Math.max(0, Math.min(100, 50 - (currentOffsetRef.current.y / maxOY) * 50))
          : 50;
      onChange({ x: Math.round(finalX * 10) / 10, y: Math.round(finalY * 10) / 10, zoom });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, overflowX, overflowY, onChange]);

  const isCustom = value && (value.x !== 50 || value.y !== 50 || (value.zoom ?? 1) !== 1);

  const commitZoom = (newZoom: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(z);
    onChange({ x: value?.x ?? 50, y: value?.y ?? 50, zoom: z });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    commitZoom(zoom + delta);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Prevuci sliku da podesiš prikaz</span>
        {isCustom && (
          <button
            type="button"
            onClick={() => { setZoom(1); onChange({ x: 50, y: 50, zoom: 1 }); }}
            className="text-xs text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        className={`relative rounded-xl overflow-hidden border border-border/50 bg-muted/30 select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
      >
        <img
          src={imageUrl}
          alt="Preview"
          draggable={false}
          className="pointer-events-none absolute top-1/2 left-1/2"
          style={{
            width: naturalSize.w * scale,
            height: naturalSize.h * scale,
            transform: `translate(calc(-50% + ${currentOffsetRef.current.x}px), calc(-50% + ${currentOffsetRef.current.y}px))`,
            maxWidth: "none",
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => commitZoom(zoom - 0.1)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Smanji"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(e) => commitZoom(parseFloat(e.target.value))}
          className="flex-1 accent-primary"
        />
        <button
          type="button"
          onClick={() => commitZoom(zoom + 0.1)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Uvećaj"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
