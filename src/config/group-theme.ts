import type { MenuGroup } from '@/features/menu/domain/menu-groups';

export type GroupTheme = { emoji: string; tone: string; card: string };

export const GROUP_THEME: Readonly<Record<MenuGroup, GroupTheme>> = {
  empanadas: { emoji: '🥟', tone: 'empanadas', card: 'bg-group-empanadas border-group-empanadas-edge dark:bg-group-empanadas-dark dark:border-group-empanadas-dark-edge' },
  pizzas: { emoji: '🍕', tone: 'pizzas', card: 'bg-group-pizzas border-group-pizzas-edge dark:bg-group-pizzas-dark dark:border-group-pizzas-dark-edge' },
  sanguches: { emoji: '🥪', tone: 'sanguches', card: 'bg-group-sanguches border-group-sanguches-edge dark:bg-group-sanguches-dark dark:border-group-sanguches-dark-edge' },
  ciabattas: { emoji: '🥖', tone: 'ciabattas', card: 'bg-group-ciabattas border-group-ciabattas-edge dark:bg-group-ciabattas-dark dark:border-group-ciabattas-dark-edge' },
  coca_cola: { emoji: '🥤', tone: 'coca', card: 'bg-group-coca border-group-coca-edge dark:bg-group-coca-dark dark:border-group-coca-dark-edge' },
  pepsi: { emoji: '🥤', tone: 'pepsi', card: 'bg-group-pepsi border-group-pepsi-edge dark:bg-group-pepsi-dark dark:border-group-pepsi-dark-edge' },
};
