import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookMarked, PackageOpen, Headphones, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    redirect(profile?.role === 'admin' || profile?.role === 'super_admin' ? `/${locale}/admin` : `/${locale}/dashboard`);
  }

  const features = [
    { icon: BookMarked, title: dict.landing.feature1Title, body: dict.landing.feature1Body },
    { icon: PackageOpen, title: dict.landing.feature2Title, body: dict.landing.feature2Body },
    { icon: Headphones, title: dict.landing.feature3Title, body: dict.landing.feature3Body },
  ];

  return (
    <main className="min-h-screen bg-surface-0">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo variant="compact" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={locale} />
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm">
              {dict.landing.ctaLogin}
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <span className="rounded-pill bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-600">
          {dict.landing.heroEyebrow}
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-ink-900 sm:text-5xl">
          {dict.landing.heroTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-ink-400 sm:text-lg">{dict.landing.heroSubtitle}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/${locale}/signup`}>
            <Button variant="secondary" size="lg">
              {dict.landing.ctaSignup}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="outline" size="lg">
              {dict.landing.ctaLogin}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="rounded-card border border-border-soft bg-surface-0 p-7 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{feature.body}</p>
            </div>
          );
        })}
      </section>

      <footer className="border-t border-border-soft px-6 py-8 text-center text-sm text-ink-400">
        {dict.landing.footerNote}
      </footer>
    </main>
  );
}
