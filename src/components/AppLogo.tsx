interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 64, className = "" }: AppLogoProps) {
  return (
    <img
      src="/trilho-logo.png"
      alt="Trilho"
      width={size}
      height={size}
      decoding="async"
      className={`rounded-[22px] shadow-glow-mint-lg ${className}`}
    />
  );
}
