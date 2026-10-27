import { CanSoda, Pizza, Sandwich, type LucideIcon } from 'lucide-react';
import { Ciabatta } from '@/components/icons/ciabatta';
import { Empanada } from '@/components/icons/empanada';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';

export type GroupTheme = { icon: LucideIcon; tone: string; card: string };

export const GROUP_THEME: Readonly<Record<MenuGroup, GroupTheme>> = {
  empanadas: { icon: Empanada, tone: 'empanadas', card: 'bg-group-empanadas border-group-empanadas-edge dark:bg-group-empanadas-dark dark:border-group-empanadas-dark-edge' },
  pizzas: { icon: Pizza, tone: 'pizzas', card: 'bg-group-pizzas border-group-pizzas-edge dark:bg-group-pizzas-dark dark:border-group-pizzas-dark-edge' },
  sanguches: { icon: Sandwich, tone: 'sanguches', card: 'bg-group-sanguches border-group-sanguches-edge dark:bg-group-sanguches-dark dark:border-group-sanguches-dark-edge' },
  ciabattas: { icon: Ciabatta, tone: 'ciabattas', card: 'bg-group-ciabattas border-group-ciabattas-edge dark:bg-group-ciabattas-dark dark:border-group-ciabattas-dark-edge' },
  coca_cola: { icon: CanSoda, tone: 'coca', card: 'bg-group-coca border-group-coca-edge dark:bg-group-coca-dark dark:border-group-coca-dark-edge' },
  pepsi: { icon: CanSoda, tone: 'pepsi', card: 'bg-group-pepsi border-group-pepsi-edge dark:bg-group-pepsi-dark dark:border-group-pepsi-dark-edge' },
};
