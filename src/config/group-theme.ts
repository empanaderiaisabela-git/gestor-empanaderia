import { CanSoda, Pizza, Sandwich, type LucideIcon } from 'lucide-react';
import { Ciabatta } from '@/components/icons/ciabatta';
import { Empanada } from '@/components/icons/empanada';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';

export type GroupTheme = { icon: LucideIcon; tone: string; card: string; kpi: string; chip: string };

export const GROUP_THEME: Readonly<Record<MenuGroup, GroupTheme>> = {
  empanadas: {
    icon: Empanada,
    tone: 'empanadas',
    card: 'bg-group-empanadas border-group-empanadas-edge dark:bg-group-empanadas-dark dark:border-group-empanadas-dark-edge',
    kpi: 'border-group-empanadas-accent bg-group-empanadas-accent/5 dark:border-group-empanadas-dark-accent dark:bg-group-empanadas-dark-accent/10',
    chip: 'bg-group-empanadas text-group-empanadas-accent dark:bg-group-empanadas-dark dark:text-group-empanadas-dark-accent',
  },
  pizzas: {
    icon: Pizza,
    tone: 'pizzas',
    card: 'bg-group-pizzas border-group-pizzas-edge dark:bg-group-pizzas-dark dark:border-group-pizzas-dark-edge',
    kpi: 'border-group-pizzas-accent bg-group-pizzas-accent/5 dark:border-group-pizzas-dark-accent dark:bg-group-pizzas-dark-accent/10',
    chip: 'bg-group-pizzas text-group-pizzas-accent dark:bg-group-pizzas-dark dark:text-group-pizzas-dark-accent',
  },
  sanguches: {
    icon: Sandwich,
    tone: 'sanguches',
    card: 'bg-group-sanguches border-group-sanguches-edge dark:bg-group-sanguches-dark dark:border-group-sanguches-dark-edge',
    kpi: 'border-group-sanguches-accent bg-group-sanguches-accent/5 dark:border-group-sanguches-dark-accent dark:bg-group-sanguches-dark-accent/10',
    chip: 'bg-group-sanguches text-group-sanguches-accent dark:bg-group-sanguches-dark dark:text-group-sanguches-dark-accent',
  },
  ciabattas: {
    icon: Ciabatta,
    tone: 'ciabattas',
    card: 'bg-group-ciabattas border-group-ciabattas-edge dark:bg-group-ciabattas-dark dark:border-group-ciabattas-dark-edge',
    kpi: 'border-group-ciabattas-accent bg-group-ciabattas-accent/5 dark:border-group-ciabattas-dark-accent dark:bg-group-ciabattas-dark-accent/10',
    chip: 'bg-group-ciabattas text-group-ciabattas-accent dark:bg-group-ciabattas-dark dark:text-group-ciabattas-dark-accent',
  },
  coca_cola: {
    icon: CanSoda,
    tone: 'coca',
    card: 'bg-group-coca border-group-coca-edge dark:bg-group-coca-dark dark:border-group-coca-dark-edge',
    kpi: 'border-group-coca-accent bg-group-coca-accent/5 dark:border-group-coca-dark-accent dark:bg-group-coca-dark-accent/10',
    chip: 'bg-group-coca text-group-coca-accent dark:bg-group-coca-dark dark:text-group-coca-dark-accent',
  },
  pepsi: {
    icon: CanSoda,
    tone: 'pepsi',
    card: 'bg-group-pepsi border-group-pepsi-edge dark:bg-group-pepsi-dark dark:border-group-pepsi-dark-edge',
    kpi: 'border-group-pepsi-accent bg-group-pepsi-accent/5 dark:border-group-pepsi-dark-accent dark:bg-group-pepsi-dark-accent/10',
    chip: 'bg-group-pepsi text-group-pepsi-accent dark:bg-group-pepsi-dark dark:text-group-pepsi-dark-accent',
  },
};
