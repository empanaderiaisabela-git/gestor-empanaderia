'use client';

import Link from 'next/link';
import type { JSX } from 'react';
import { Boxes, ChartColumn, type LucideIcon, Package, ShieldAlert, ShoppingBag, Tags, Truck, UserCog, Users, UtensilsCrossed } from 'lucide-react';
import { navigationFor } from '@/config/navigation';
import type { Role } from '@/features/auth/domain/auth.schema';

const ICONS: Readonly<Record<string, LucideIcon>> = {
  '/': ChartColumn,
  '/stock': Boxes,
  '/ventas': ShoppingBag,
  '/clientes': Users,
  '/proveedores': Truck,
  '/alta-de-productos': UtensilsCrossed,
  '/categorias': Tags,
  '/usuarios': UserCog,
  '/logs': ShieldAlert,
};

type SidebarNavProps = { role: Role; pathname: string; onNavigate: () => void };

const ACTIVE = 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400';
const IDLE = 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200';

export function SidebarNav({ role, pathname, onNavigate }: SidebarNavProps): JSX.Element {
  return (
    <nav
      aria-label='Menú principal'
      className='flex-1 space-y-1 px-3 mt-4 overflow-y-auto custom-scrollbar'
    >
      {navigationFor(role).map(({ href, label }) => {
        const isActive = pathname === href;
        const Icon = ICONS[href] ?? Package;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center px-3 py-2.5 text-md font-medium rounded-lg transition-all focus:outline-none ${isActive ? ACTIVE : IDLE}`}
          >
            <Icon className={`shrink-0 w-5 h-5 mr-3 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
