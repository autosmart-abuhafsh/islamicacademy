import React from 'react';
import { IslamicAcademyLogo } from './IslamicOrnament';

interface IslamicLoadingScreenProps {
  title?: string;
  subtitle?: string;
  onSkip?: () => void;
}

export function IslamicLoadingScreen({
  title = "Ma'had Darul 'Ilm Al-Islami",
  subtitle = 'Menyiapkan Portal Akademik, LMS & Perpustakaan 9 Silsilah Keilmuan...',
  onSkip,
}: IslamicLoadingScreenProps) {
  return (
    <div
      data-testid="islamic-loading-screen"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#0B1727] text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none"
    >
      {/* Ambient Radial Illumination */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(197, 164, 91, 0.24) 0%, rgba(8, 116, 81, 0.18) 38%, rgba(11, 23, 39, 0.98) 78%)',
        }}
      />

      {/* Rotating Geometric Rings + Central Islamic Academy Crest */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
        {/* Outer Clockwise Rub el Hizb Ring */}
        <svg
          viewBox="0 0 200 200"
          fill="none"
          className="absolute inset-0 w-full h-full text-[#C5A45B]/55 animate-spin-slow"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
          <rect
            x="34"
            y="34"
            width="132"
            height="132"
            rx="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="34"
            y="34"
            width="132"
            height="132"
            rx="10"
            transform="rotate(45 100 100)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>

        {/* Inner Counter-Clockwise Emerald Geometric Ring */}
        <svg
          viewBox="0 0 200 200"
          fill="none"
          className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] text-[#34D399]/60 animate-spin-reverse-slow"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="74"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 5"
          />
          <rect
            x="46"
            y="46"
            width="108"
            height="108"
            transform="rotate(22.5 100 100)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="46"
            y="46"
            width="108"
            height="108"
            transform="rotate(67.5 100 100)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>

        {/* Pulsing Golden Halo */}
        <div className="w-24 h-24 rounded-full bg-[#C5A45B]/25 blur-xl absolute animate-pulse" />

        {/* Central Logo Crest */}
        <div className="relative z-10 p-3 rounded-2xl bg-[#14283F]/90 border border-[#C5A45B]/60 shadow-[0_0_35px_rgba(197,164,91,0.35)]">
          <IslamicAcademyLogo className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>
      </div>

      {/* Arabic Calligraphy & Title */}
      <div className="relative z-10 text-center max-w-md space-y-2.5">
        <p
          className="font-arabic text-2xl sm:text-3xl font-bold text-gold-shimmer"
          dir="rtl"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h2 className="text-xl sm:text-2xl font-display font-bold tracking-wide text-white">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-[#F5F0E4]/80 leading-relaxed">
          {subtitle}
        </p>

        {/* Animated Shimmering Progress Bar */}
        <div className="pt-3 w-64 sm:w-72 mx-auto">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden border border-[#C5A45B]/30">
            <div
              className="h-full rounded-full animate-pulse"
              style={{
                width: '100%',
                background:
                  'linear-gradient(90deg, #087451 0%, #C5A45B 50%, #0E9F6E 100%)',
              }}
            />
          </div>
        </div>

        {onSkip && (
          <div className="pt-3">
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] font-medium text-[#C5A45B]/80 hover:text-white underline"
            >
              Masuk Sekarang &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
