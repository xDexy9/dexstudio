// Translation disabled in demo mode — returns original text
import { Language } from './i18n';

export async function detectLanguage(_text: string): Promise<Language> {
  return 'en';
}

export async function translateText(
  text: string, _fromLang: Language, _toLang: Language
): Promise<string> {
  return text;
}

export async function translateToAllLanguages(
  _text: string, _originalLang: Language
): Promise<Partial<Record<Language, string>>> {
  return {};
}
