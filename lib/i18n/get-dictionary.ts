import type { Locale } from './config';
import fr from './dictionaries/fr';
import ar from './dictionaries/ar';
import type { Dictionary } from './dictionaries/fr';

const dictionaries: Record<Locale, Dictionary> = { fr, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.fr;
}

export type { Dictionary };

/**
 * Tiny `{placeholder}` interpolation helper, e.g.
 * t(dict.auth.emailCodeBody, { email: 'a@b.com' })
 */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}
