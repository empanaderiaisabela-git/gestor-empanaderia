import type { Role } from '@/features/auth/domain/auth.schema';

export type NavItem = { href: string; label: string };

const SECTIONS = {
  estadisticas: { href: '/', label: 'Estadísticas' },
  productos: { href: '/productos', label: 'Productos' },
  ventas: { href: '/ventas', label: 'Ventas/Pedidos' },
  clientes: { href: '/clientes', label: 'Clientes' },
  proveedores: { href: '/proveedores', label: 'Proveedores' },
  categorias: { href: '/categorias', label: 'Categorías' },
  usuarios: { href: '/usuarios', label: 'Usuarios' },
  auditoria: { href: '/logs', label: 'Auditoría' },
} as const satisfies Record<string, NavItem>;

type Section = keyof typeof SECTIONS;

const MENU: Readonly<Record<Role, readonly Section[]>> = {
  admin: ['estadisticas', 'productos', 'ventas', 'clientes', 'proveedores', 'categorias', 'usuarios', 'auditoria'],
  vendedor: ['ventas', 'productos', 'clientes'],
};

const HOME: Readonly<Record<Role, string>> = { admin: '/', vendedor: '/ventas' };

export function navigationFor(role: Role): NavItem[] {
  return MENU[role].map((section) => SECTIONS[section]);
}

export function homeFor(role: Role): string {
  return HOME[role];
}

function matches(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function canVisit(role: Role, pathname: string): boolean {
  return navigationFor(role).some((item) => matches(item.href, pathname));
}
