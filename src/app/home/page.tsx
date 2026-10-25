import { Metadata } from 'next';
import { fetchCatalog } from '@/features/menu/actions/fetch-catalog';
import { CATALOG_GROUPS } from '@/features/menu/domain/catalog';
import { CatalogClient } from './components/catalog-client';
import { BrandLogo } from '@/components/brand/brand-logo';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: `${BRAND.name} - Catálogo`,
  description: BRAND.catalogDescription,
  keywords: 'empanadas, pizzas, sándwiches de miga, ciabattas, empanadería, rotisería, Empanadería Isabela',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.catalogDescription,
    type: 'website',
  },
};

import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function HomePage() {
  const products = await fetchCatalog();
  const categories = CATALOG_GROUPS.filter((group) => products.some((product) => product.group === group.id));

  return (
    <div className='lg:h-screen lg:overflow-hidden bg-cream dark:bg-zinc-950 selection:bg-brand-500/30 flex flex-col'>
      {/* Hero Section */}
      <section className='relative pb-4 md:pb-10 pt-16 md:pt-12 overflow-hidden px-4 sm:px-8 shrink-0'>
        <div className='absolute top-4 right-4 z-50'>
          <ThemeToggle />
        </div>
        <div className='max-w-6xl mx-auto flex justify-center'>
          <h1 className='sr-only'>{BRAND.name}</h1>
          <BrandLogo size='lg' />
        </div>
      </section>

      {/* Catalog Section */}
      <div className='flex-1 min-h-0'>
        <CatalogClient
          products={products}
          categories={categories}
        />
      </div>

      {/* Footer - Minimal on desktop to save space */}
      <footer className='shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-[14px] text-zinc-500 dark:text-zinc-400 px-6'>
        <p>
          © {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
