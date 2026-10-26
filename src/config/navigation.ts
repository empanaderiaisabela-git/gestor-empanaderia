import type { Role } from '@/features/auth/domain/auth.schema';

export type NavItem = { href: string; label: string };

const SECTIONS = {
  estadisticas: { href: '/', label: 'Estadísticas' },
  gastos: { href: '/gastos', label: 'Gastos' },
  stock: { href: '/stock', label: 'Stock' },
  ventas: { href: '/ventas', label: 'Ventas/Pedidos' },
  promociones: { href: '/promociones', label: 'Promociones' },
  clientes: { href: '/clientes', label: 'Clientes' },
  proveedores: { href: '/proveedores', label: 'Proveedores' },
  altaProductos: { href: '/alta-de-productos', label: 'Alta de productos' },
  tarjetas: { href: '/tarjetas', label: 'Tarjetas' },
  usuarios: { href: '/usuarios', label: 'Usuarios' },
  auditoria: { href: '/logs', label: 'Auditoría' },
} as const satisfies Record<string, NavItem>;

type Section = keyof typeof SECTIONS;

const MENU: Readonly<Record<Role, readonly Section[]>> = {
  admin: ['estadisticas', 'gastos', 'stock', 'ventas', 'promociones', 'clientes', 'proveedores', 'altaProductos', 'tarjetas', 'usuarios', 'auditoria'],
  vendedor: ['ventas', 'stock', 'clientes'],
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
