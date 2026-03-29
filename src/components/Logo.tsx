interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { text: "text-lg", x: "text-base" },
  md: { text: "text-[22px]", x: "text-[20px]" },
  lg: { text: "text-3xl", x: "text-2xl" },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className={`font-display tracking-tight ${s.text}`}>
        <span className="text-primary font-bold italic">{`X`}</span>
        <span className="text-foreground font-bold">job</span>
        <span className="text-primary font-extrabold">FAIR</span>
      </span>
    </span>
  );
}
