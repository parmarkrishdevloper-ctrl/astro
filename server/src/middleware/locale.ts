import type { Request, Response, NextFunction } from 'express';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '../i18n';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

/**
 * Resolve the request locale from (in priority order):
 *   1. `X-Lang` header
 *   2. `?lang=` query param
 *   3. `Accept-Language` header (first part)
 * Falls back to 'en'.
 *
 * Stores the result on `req.locale` so any service or renderer can read it.
 */
export function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  let resolved: Locale = 'en';

  // 1. X-Lang header
  const headerLang = req.header('X-Lang') ?? req.header('x-lang');
  if (headerLang && isLocale(headerLang)) {
    resolved = headerLang;
  } else {
    // 2. Query param
    const qLang = typeof req.query.lang === 'string' ? req.query.lang : undefined;
    if (qLang && isLocale(qLang)) {
      resolved = qLang;
    } else {
      // 3. Accept-Language
      const acceptLang = req.header('Accept-Language') ?? req.header('accept-language');
      if (acceptLang) {
        const first = acceptLang.split(',')[0]?.trim().toLowerCase().split('-')[0];
        if (first && isLocale(first)) resolved = first;
      }
    }
  }

  // Defensive — shouldn't fire because isLocale already filters.
  if (!SUPPORTED_LOCALES.includes(resolved)) resolved = 'en';

  req.locale = resolved;
  next();
}
