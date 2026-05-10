interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 32, className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="PWD Job Pairing Platform logo"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle - teal */}
        <circle cx="16" cy="16" r="15" fill="hsl(183 85% 28%)" />
        {/* Two hands / connecting nodes representing pairing */}
        {/* Left person silhouette - dot head + body arc */}
        <circle cx="10" cy="9" r="2.5" fill="white" />
        <path d="M6.5 22 Q10 16 13.5 22" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Right person silhouette */}
        <circle cx="22" cy="9" r="2.5" fill="white" />
        <path d="M18.5 22 Q22 16 25.5 22" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Connecting bridge / match symbol */}
        <path d="M13.5 13 C14.5 10.5 17.5 10.5 18.5 13" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="13.5" r="1.2" fill="white" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm text-primary" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            PWD Connect
          </span>
          <span className="text-[9px] text-muted-foreground font-medium tracking-wide uppercase">
            Legazpi City
          </span>
        </div>
      )}
    </div>
  );
}
