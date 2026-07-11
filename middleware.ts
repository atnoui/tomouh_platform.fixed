import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, isLocale } from '@/lib/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

function getLocaleFromRequest(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  if (acceptLanguage.toLowerCase().includes('ar')) return 'ar';

  return defaultLocale;
}

const PROTECTED_STUDENT_PREFIX = '/dashboard';
const PROTECTED_ADMIN_PREFIX = '/admin';
const GUEST_ONLY_PATHS = ['/login', '/signup', '/admin-register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Locale prefixing: redirect "/" and any unprefixed path to a locale.
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!pathnameHasLocale) {
    const locale = getLocaleFromRequest(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', locale, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // 2) Refresh the Supabase session for this request.
  const { response, user } = await updateSession(request);

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  const rest = `/${segments.slice(1).join('/')}`;

  const isProtectedStudent = rest.startsWith(PROTECTED_STUDENT_PREFIX);
  const isProtectedAdmin = rest.startsWith(PROTECTED_ADMIN_PREFIX);
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => rest === p || rest === `${p}/`);

  if ((isProtectedStudent || isProtectedAdmin) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('next', rest);
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
