import type { JSX } from 'react';
import { BRAND } from '@/config/brand';

type BrandLogoProps = {
  size?: 'sm' | 'lg';
  showName?: boolean;
};

const SIZES = { sm: 'w-11 h-11', lg: 'w-24 h-24' } as const;
const NAME_SIZES = { sm: 'text-lg', lg: 'text-2xl' } as const;

export function BrandLogo({ size = 'sm', showName = true }: BrandLogoProps): JSX.Element {
  const vertical = size === 'lg';
  return (
    <div className={`flex items-center ${vertical ? 'flex-col gap-3 text-center' : 'gap-3'}`}>
      <img
        src={BRAND.logoSrc}
        alt={BRAND.name}
        className={`${SIZES[size]} shrink-0 rounded-full object-cover shadow-sm`}
      />
      {showName && <span className={`${NAME_SIZES[size]} font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100`}>{BRAND.name}</span>}
    </div>
  );
}
