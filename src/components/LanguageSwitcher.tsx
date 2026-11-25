import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { AppLanguage, LANGUAGE_OPTIONS } from '../utils/i18n';

interface LanguageSwitcherProps {
  language: AppLanguage;
  onChangeLanguage: (nextLang: AppLanguage) => void;
}

export function LanguageSwitcher({
  language,
  onChangeLanguage,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    LANGUAGE_OPTIONS.find((o) => o.id === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      data-no-translate="true"
      className="relative inline-flex items-center shrink-0"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Pilih Bahasa Portal"
        title="Pilih Bahasa / Select Language / اختر اللغة"
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#14283F]/15 bg-[#F5F0E4]/70 text-[#14283F] hover:border-[#C5A45B] transition-colors text-xs font-semibold"
      >
        <Globe className="w-3.5 h-3.5 text-[#087451] shrink-0" />
        <span>{currentOption.shortLabel}</span>
        <span className="hidden md:inline text-[#14283F]/75 font-medium">
          · {currentOption.nativeName}
        </span>
        <ChevronDown className="w-3 h-3 text-[#14283F]/60 shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white border border-[#14283F]/15 shadow-xl py-1 z-50"
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = opt.id === language;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChangeLanguage(opt.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-[#087451] text-white font-semibold'
                    : 'text-[#14283F] hover:bg-[#F5F0E4]'
                }`}
              >
                <span>{opt.nativeName}</span>
                <span
                  className={`text-[10px] font-mono-num px-1.5 py-0.5 rounded ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F5F0E4] text-[#087451] font-bold'
                  }`}
                >
                  {opt.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
