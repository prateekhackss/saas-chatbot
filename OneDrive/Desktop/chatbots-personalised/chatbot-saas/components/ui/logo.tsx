interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  tone?: "dark" | "light";
}

export function Logo({ 
  className = "", 
  showTagline = false, 
  size = "md",
  variant = "full",
  tone = "dark"
}: LogoProps) {
  
  const textColor = tone === "dark" ? "text-white" : "text-stone-950";
  
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
    xl: "text-6xl text-[4rem]",
  };
  
  const taglineSizeClasses = {
    sm: "text-[0.45rem] tracking-[0.2em] mt-0.5",
    md: "text-[0.65rem] tracking-[0.25em] mt-1",
    lg: "text-xs tracking-[0.3em] mt-1.5",
    xl: "text-sm tracking-[0.3em] mt-2",
  };

  if (variant === "icon") {
    return (
      <div className={`font-archivo tracking-tight select-none flex items-center justify-center ${sizeClasses[size]} ${className}`} aria-hidden="true">
        <span className={textColor}>N</span>
        <span className="text-[#EF4444]">C</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className={`font-archivo tracking-tight ${textColor} flex items-center ${sizeClasses[size]}`}>
        Nexus<span className="text-[#EF4444]">Chat</span>
      </div>
      {showTagline && (
        <div className={`font-sora font-light text-[#a3a3a3] uppercase ${taglineSizeClasses[size]}`}>
          AI Customer Support
        </div>
      )}
    </div>
  );
}
