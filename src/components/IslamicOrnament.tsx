import React from 'react';

export function IslamicAcademyLogo({
  className = 'w-8 h-8',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      role="img"
      aria-label="Logo Islamic Academy Portal"
    >
      <defs>
        <linearGradient id="logoBgNavy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14283F" />
          <stop offset="55%" stopColor="#0D1D30" />
          <stop offset="100%" stopColor="#087451" />
        </linearGradient>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1D792" />
          <stop offset="50%" stopColor="#C5A45B" />
          <stop offset="100%" stopColor="#9A7B38" />
        </linearGradient>
        <linearGradient id="logoEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0E9F6E" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
      </defs>

      <rect
        x="8"
        y="8"
        width="240"
        height="240"
        rx="52"
        fill="url(#logoBgNavy)"
        stroke="url(#logoGold)"
        strokeWidth="8"
      />

      <g transform="translate(128,128)">
        <rect
          x="-68"
          y="-68"
          width="136"
          height="136"
          rx="8"
          fill="none"
          stroke="url(#logoGold)"
          strokeWidth="5"
          opacity="0.9"
        />
        <rect
          x="-68"
          y="-68"
          width="136"
          height="136"
          rx="8"
          fill="url(#logoEmerald)"
          fillOpacity="0.35"
          stroke="url(#logoGold)"
          strokeWidth="5"
          transform="rotate(45)"
        />
        <circle
          cx="0"
          cy="0"
          r="56"
          fill="#102136"
          stroke="url(#logoGold)"
          strokeWidth="3"
        />
      </g>

      <path
        d="M128 46 C128 46 135 54 135 61 C135 65 132 68 128 68 C124 68 121 65 121 61 C121 54 128 46 128 46 Z"
        fill="url(#logoGold)"
      />
      <path
        d="M98 118 C98 92 114 78 128 70 C142 78 158 92 158 118"
        fill="none"
        stroke="url(#logoGold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      <path
        d="M78 118 C94 114 114 118 128 128 C142 118 162 114 178 118 L178 162 C162 158 142 162 128 172 C114 162 94 158 78 162 Z"
        fill="#F5F0E4"
        stroke="url(#logoGold)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line
        x1="128"
        y1="127"
        x2="128"
        y2="171"
        stroke="#087451"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M96 178 L128 166 L160 178"
        fill="none"
        stroke="url(#logoGold)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BerandaCelestialAura({
  spotlightPos,
}: {
  spotlightPos: { x: number; y: number };
}) {
  const particles = [
    { top: '14%', left: '12%', size: 'w-2 h-2', delay: '0s' },
    { top: '26%', left: '34%', size: 'w-1.5 h-1.5', delay: '1.1s' },
    { top: '18%', left: '62%', size: 'w-2.5 h-2.5', delay: '0.6s' },
    { top: '48%', left: '78%', size: 'w-2 h-2', delay: '1.9s' },
    { top: '72%', left: '22%', size: 'w-2 h-2', delay: '2.4s' },
    { top: '65%', left: '54%', size: 'w-1.5 h-1.5', delay: '0.9s' },
    { top: '34%', left: '88%', size: 'w-2.5 h-2.5', delay: '1.5s' },
    { top: '82%', left: '72%', size: 'w-2 h-2', delay: '2.8s' },
  ];

  return (
    <div
      data-testid="beranda-light-aura"
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none select-none"
    >
      {/* Dynamic Interactive Cursor / Ambient Spotlight Glow */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(540px circle at ${spotlightPos.x}% ${spotlightPos.y}%, rgba(197, 164, 91, 0.24), rgba(8, 116, 81, 0.14) 45%, transparent 78%)`,
        }}
      />

      {/* Ambient Celestial Emerald & Gold Orbs */}
      <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-[#C5A45B]/20 blur-3xl animate-pulse-aura" />
      <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-[#087451]/30 blur-3xl animate-pulse-aura" />

      {/* Diagonal Celestial Light Rays (Nur Beams) */}
      <div
        className="absolute -top-1/2 left-1/4 w-44 h-[220%] rotate-35 opacity-25 blur-2xl animate-pulse-aura"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(248, 229, 168, 0.55), transparent)',
        }}
      />
      <div
        className="absolute -top-1/2 right-1/3 w-32 h-[220%] rotate-35 opacity-20 blur-2xl animate-pulse-aura"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.45), transparent)',
        }}
      />

      {/* Slow-Rotating Sacred Islamic Geometric Mandala (Shamsa Rosette) */}
      <div className="absolute -right-24 -top-24 sm:-right-16 sm:-top-16 w-80 h-80 sm:w-[440px] sm:h-[440px] opacity-25">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          className="w-full h-full text-[#C5A45B] animate-spin-slow"
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="4 4"
          />
          <circle
            cx="100"
            cy="100"
            r="72"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="38"
            y="38"
            width="124"
            height="124"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="38"
            y="38"
            width="124"
            height="124"
            transform="rotate(30 100 100)"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="38"
            y="38"
            width="124"
            height="124"
            transform="rotate(60 100 100)"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="42"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Counter-Rotating Inner Geometric Ring */}
      <div className="absolute -left-24 -bottom-24 w-72 h-72 opacity-15">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          className="w-full h-full text-[#34D399] animate-spin-reverse-slow"
        >
          <circle
            cx="100"
            cy="100"
            r="82"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="6 3"
          />
          <rect
            x="44"
            y="44"
            width="112"
            height="112"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="44"
            y="44"
            width="112"
            height="112"
            transform="rotate(45 100 100)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Floating Golden & Emerald Nur Dust Motes */}
      {particles.map((pt, idx) => (
        <span
          key={idx}
          style={{
            top: pt.top,
            left: pt.left,
            animationDelay: pt.delay,
          }}
          className={`absolute ${pt.size} rounded-full bg-[#F8E5A8] shadow-[0_0_12px_3px_rgba(197,164,91,0.75)] animate-float-nur`}
        />
      ))}
    </div>
  );
}

export function IslamicCornerMotif({
  className = 'w-12 h-12 text-[#C5A45B]/30',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 2H28C28 16.3594 16.3594 28 2 28V2Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M8 8L22 8L8 22L8 8Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function IslamicSectionDivider({ label }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-4 my-6"
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-[#C5A45B]/35" />
      <div className="flex items-center gap-2 text-[#C5A45B]">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <polygon
            points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        {label && (
          <span className="text-xs font-medium tracking-wider text-[#14283F]/70">
            {label}
          </span>
        )}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <polygon
            points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="h-px flex-1 bg-[#C5A45B]/35" />
    </div>
  );
}

export function KitabCoverArtwork({
  arabicTitle,
  code,
  accentColor = '#087451',
}: {
  arabicTitle: string;
  code: string;
  accentColor?: string;
  difficultyLevel?: string;
}) {
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-[#C5A45B]/50 flex flex-col justify-between p-4 select-none shadow-sm"
      style={{ backgroundColor: accentColor }}
    >
      {/* Inner Golden Frame */}
      <div className="absolute inset-2 border border-[#C5A45B]/45 rounded pointer-events-none" />
      <div className="absolute inset-3 border border-[#C5A45B]/25 rounded pointer-events-none" />

      {/* Top Code */}
      <div className="relative z-10 text-center text-[9px] text-[#F5F0E4]/85 font-mono-num truncate px-1">
        {code}
      </div>

      {/* Center Geometric Medallion & Arabic Title */}
      <div className="relative z-10 my-auto py-3 px-2 text-center">
        <div className="mx-auto w-8 h-8 mb-2 text-[#C5A45B] flex items-center justify-center">
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
            <rect
              x="6"
              y="6"
              width="20"
              height="20"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect
              x="6"
              y="6"
              width="20"
              height="20"
              transform="rotate(45 16 16)"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle
              cx="16"
              cy="16"
              r="4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </div>
        <p
          className="font-arabic text-lg sm:text-xl font-bold text-[#F5F0E4] leading-relaxed line-clamp-3"
          dir="rtl"
        >
          {arabicTitle}
        </p>
      </div>

      {/* Bottom Ornament Bar */}
      <div className="relative z-10 text-center border-t border-[#C5A45B]/30 pt-1.5">
        <span className="text-[10px] tracking-widest text-[#C5A45B]">
          مكتبة معهد دار العلم
        </span>
      </div>
    </div>
  );
}
