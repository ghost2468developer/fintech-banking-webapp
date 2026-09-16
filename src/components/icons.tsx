type IconProps = { className?: string };

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LogoMark({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="12" cy="12" r="9.25" />
      <ellipse cx="12" cy="12" rx="4.2" ry="9.25" />
      <path d="M2.75 12h18.5" />
    </svg>
  );
}

export function IconSend({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function IconReceive({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M17 7 7 17" />
      <path d="M15 17H7V9" />
    </svg>
  );
}

export function IconWallet({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M4 9.5h16" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconShield({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M12 3 5 5.8v5.4c0 4.5 3 7.7 7 9.8 4-2.1 7-5.3 7-9.8V5.8L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </svg>
  );
}

export function IconUsers({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.5 19c.6-3 2.9-4.75 5.5-4.75S13.9 16 14.5 19" />
      <path d="M15.5 5.6a3.25 3.25 0 0 1 0 5.8" />
      <path d="M17.5 14.6c1.7.6 2.7 2 3 4.4" />
    </svg>
  );
}

export function IconUser({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.7-5.5 7-5.5s6.2 1.9 7 5.5" />
    </svg>
  );
}

export function IconPlus({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function IconLogout({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M14 4h-8a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8" />
      <path d="M10 12h10m0 0-3.5-3.5M20 12l-3.5 3.5" />
    </svg>
  );
}

export function IconActivity({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M3 12h4l2.5-6.5 5 13L17 12h4" />
    </svg>
  );
}

export function IconCard({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <path d="M6.5 15.5h4" />
    </svg>
  );
}

export function IconCoin({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2a3.2 3.2 0 0 0-2.8-1.5c-1.7 0-3 .9-3 2.1s1.2 1.8 3 2.2c1.9.4 3.1 1 3.1 2.3 0 1.3-1.4 2.2-3.2 2.2a3.6 3.6 0 0 1-3.1-1.6" />
      <path d="M12 6.5v11" />
    </svg>
  );
}

export function IconChevron({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconCheck({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconX({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconBank({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" />
      <path d="M3.5 20h17" />
    </svg>
  );
}

export function IconGauge({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
      <path d="m12 14 3.8-4.5" />
      <circle cx="12" cy="14" r="1.4" />
    </svg>
  );
}

export function IconArrowRight({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
    </svg>
  );
}

export function IconCart({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4 5h2.2l2 10.6a1 1 0 0 0 1 .7h7.6a1 1 0 0 0 1-.75L20.5 8.5H7" />
      <circle cx="10.5" cy="19.8" r="1.1" />
      <circle cx="16.8" cy="19.8" r="1.1" />
    </svg>
  );
}

export function IconReceipt({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M6 3.5v17l2-1.2 2 1.2 2-1.2 2 1.2 2-1.2 2 1.2v-17l-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2Z" />
      <path d="M9.5 9.5h5M9.5 13.5h5" />
    </svg>
  );
}

export function IconRepeat({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="m17 2.5 3 3-3 3" />
      <path d="M4 11.5v-1a4 4 0 0 1 4-4h12" />
      <path d="m7 21.5-3-3 3-3" />
      <path d="M20 12.5v1a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

export function IconPause({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M9.5 5.5v13M14.5 5.5v13" />
    </svg>
  );
}

export function IconPlay({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
    </svg>
  );
}

export function IconCopy({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  );
}
