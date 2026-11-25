import React from 'react';
import { Globe } from 'lucide-react';
import { AppLanguage, LANGUAGE_OPTIONS } from '../utils/i18n';

interface LanguageSwitcherProps {
  language: AppLanguage;
  onChangeLanguage: (nextLang: AppLanguage) => void;
}

export function LanguageSwitcher({
  language,
  onChangeLanguage,
}: LanguageSwitcherProps) {
  return (
    <div
      data-no-translate="true"
      className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg border border-[#14283F]/15 bg-[#F5F0E4]/65 text-[#14283F] hover:border-[#C5A45B] transition-colors shrink-0"
      title="Pilih Bahasa / Select Language / اختر اللغة"
    >
      <Globe className="w-3.5 h-3.5 text-[#087451] shrink-0" />
      <select
        aria-label="Pilih Bahasa Portal"
        value={language}
        onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
        className="bg-transparent text-xs font-semibold text-[#14283F] focus:outline-none cursor-pointer pr-1"
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-white text-[#14283F]">
            {opt.shortLabel} · {opt.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
