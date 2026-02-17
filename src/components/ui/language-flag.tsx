import React from 'react';
import { Language } from '@/lib/i18n';

// Maps language code to ISO 3166-1 alpha-2 country code for flagcdn.com
const LANG_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  fr: 'fr',
  ro: 'ro',
  pt: 'pt',
  ru: 'ru',
};

interface LanguageFlagProps {
  code: Language | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: { w: 16, h: 12, className: 'w-4 h-3' },
  sm: { w: 20, h: 15, className: 'w-5 h-[15px]' },
  md: { w: 24, h: 18, className: 'w-6 h-[18px]' },
  lg: { w: 32, h: 24, className: 'w-8 h-6' },
};

export function LanguageFlag({ code, size = 'md', className }: LanguageFlagProps) {
  const country = LANG_TO_COUNTRY[code] || code;
  const { w, h, className: sizeClass } = SIZE_MAP[size];

  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${country}.png`}
      srcSet={`https://flagcdn.com/${w * 2}x${h * 2}/${country}.png 2x`}
      width={w}
      height={h}
      alt={code}
      className={`inline-block rounded-[2px] object-cover ${sizeClass} ${className ?? ''}`}
      loading="lazy"
    />
  );
}
