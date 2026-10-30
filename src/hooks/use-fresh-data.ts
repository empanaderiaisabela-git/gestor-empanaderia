import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { invalidateAllCaches } from '@/stores';

export function useFreshDataOnEnter(): void {
  const pathname = usePathname();
  useEffect(() => invalidateAllCaches(), [pathname]);
}
