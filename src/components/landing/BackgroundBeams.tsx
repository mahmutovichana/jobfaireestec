import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeamPath {
  d: string;
  delay: number;
  duration: number;
  opacity: number;
  width: number;
}

function generateBeams(count: number): BeamPath[] {
  const beams: BeamPath[] = [];
  for (let i = 0; i < count; i++) {
    const startX = -100 + Math.random() * 600;
    const startY = -50 + Math.random() * 200;
    const cp1x = startX + 200 + Math.random() * 400;
    const cp1y = startY + 100 + Math.random() * 300;
    const cp2x = cp1x + 200 + Math.random() * 400;
    const cp2y = cp1y + 100 + Math.random() * 300;
    const endX = cp2x + 200 + Math.random() * 400;
    const endY = cp2y + 100 + Math.random() * 200;

    beams.push({
      d: `M${startX},${startY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`,
      delay: i * 0.4 + Math.random() * 2,
      duration: 4 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.25,
      width: 1 + Math.random() * 2,
    });
  }
  return beams;
}

export function BackgroundBeams({ className }: { className?: string }) {
  const id = useId();
  const beams = useRef(generateBeams(18)).current;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Primary red gradient */}
          <linearGradient id={`${id}-grad-1`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(4, 80%, 50%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(4, 80%, 50%)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="hsl(4, 90%, 60%)" stopOpacity="0.8" />
            <stop offset="70%" stopColor="hsl(15, 85%, 55%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(25, 80%, 55%)" stopOpacity="0" />
          </linearGradient>
          {/* Warm accent gradient */}
          <linearGradient id={`${id}-grad-2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(4, 80%, 50%)" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(350, 70%, 55%)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="hsl(4, 80%, 50%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(20, 90%, 55%)" stopOpacity="0" />
          </linearGradient>
          {/* Subtle white/foreground gradient */}
          <linearGradient id={`${id}-grad-3`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0" />
            <stop offset="45%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.12" />
            <stop offset="55%" stopColor="hsl(4, 80%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {beams.map((beam, i) => (
          <motion.path
            key={i}
            d={beam.d}
            stroke={`url(#${id}-grad-${(i % 3) + 1})`}
            strokeWidth={beam.width}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, beam.opacity, 0],
            }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
