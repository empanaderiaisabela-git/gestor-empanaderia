'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ShieldAlert, Menu, Sun, Moon, LogOut, X } from 'lucide-react';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { logoutAction } from '@/features/auth/actions/auth.actions';
import { BrandLogo } from '@/components/brand/brand-logo';
import { homeFor } from '@/config/navigation';
import { useFreshDataOnEnter } from '@/hooks/use-fresh-data';
import { SidebarNav } from './sidebar-nav';

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logoutState = useAuthStore((state) => state.logoutState);
  useFreshDataOnEnter();

  // Prevent hydration mismatch on themes
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && user && user.role !== 'admin' && pathname === '/') {
      router.push(homeFor(user.role));
    }
  }, [mounted, user, pathname, router]);

  const handleLogout = async () => {
    await logoutAction();
    logoutState();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className='flex h-full w-full flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors relative'>
      <div className='p-5 flex items-center justify-between shrink-0'>
        <BrandLogo />
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className='xl:hidden p-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100'
        >
          <X className='w-6 h-6' />
        </button>
      </div>

      <SidebarNav
        role={user?.role ?? 'vendedor'}
        pathname={pathname}
        onNavigate={() => setIsMobileMenuOpen(false)}
      />

      <div className='p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0'>
        <button
          onClick={() => setShowLogoutModal(true)}
          className='w-full flex items-center justify-between px-3 py-2 text-zinc-800 hover:text-red-500 hover:bg-red-50 dark:text-zinc-200 dark:hover:bg-red-500/10 transition-colors rounded-lg group'
        >
          <div className='flex flex-col text-left'>
            <span className='text-md font-medium group-hover:text-red-600 dark:group-hover:text-red-400'>Cerrar sesión</span>
            <span className='text-sm opacity-70'>
              {user?.username} ({user?.role})
            </span>
          </div>
          <LogOut className='w-5 h-5' />
        </button>
      </div>
    </div>
  );

  return (
    <div className='h-screen flex overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors'>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className='fixed inset-0 bg-zinc-900/80 z-40 xl:hidden backdrop-blur-sm'
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className='fixed inset-y-0 left-0 w-[240px] z-50 xl:hidden'
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className='hidden xl:flex xl:shrink-0 xl:w-[240px] no-print'>
        <SidebarContent />
      </div>

      {/* Main Column */}
      <div
        className='relative flex flex-col flex-1 min-w-0 overflow-hidden outline-none'
        tabIndex={-1}
      >
        {/* Top Header */}
        <header className='shrink-0 h-16 flex items-center justify-between px-4 lg:px-8 transition-colors bg-transparent border-none no-print xl:absolute xl:top-0 xl:right-0 xl:z-10 xl:h-auto xl:p-1'>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className='xl:hidden p-2 -ml-2 text-zinc-700 hover:text-zinc-700 dark:text-zinc-200 dark:hover:text-zinc-100'
          >
            <Menu className='w-6 h-6' />
          </button>

          <div className='flex items-center ml-auto'>
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className='p-2 xl:p-1 text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors'
                aria-label='Alternar tema'
              >
                {resolvedTheme === 'dark' ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main
          className='flex-1 relative overflow-hidden outline-none ring-0 focus:ring-0 focus-visible:ring-0 flex flex-col'
          tabIndex={-1}
        >
          <div className='flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col outline-none ring-0 focus:ring-0 focus-visible:ring-0'>{children}</div>
        </main>
      </div>

      {/* Confirm Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6'
            >
              <div className='flex items-center text-amber-500 mb-4'>
                <div className='p-2 bg-amber-100 dark:bg-amber-500/10 rounded-full mr-3'>
                  <ShieldAlert className='w-6 h-6' />
                </div>
                <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-50'>Cerrar sesión</h3>
              </div>
              <p className='text-zinc-700 dark:text-zinc-200 text-md mb-6'>¿Estás seguro de que deseas salir del panel de control? Tendrás que volver a ingresar tus credenciales.</p>
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className='px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium'
                >
                  Sí, Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
