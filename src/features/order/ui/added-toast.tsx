'use client';

import { CheckCircle2 } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TOAST_MS = 2000;

export function useAddedToast(): { added: string | null; notify: (name: string) => void } {
  const [added, setAdded] = useState<{ name: string } | null>(null);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [added]);
  return { added: added?.name ?? null, notify: (name) => setAdded({ name }) };
}

export function AddedToast({ name }: { name: string | null }): JSX.Element | null {
  if (!name) return null;
  return createPortal(
    <p role='status' className='pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-xl'>
      <CheckCircle2 className='w-5 h-5 shrink-0' />
      {`Se agregó ${name} al pedido`}
    </p>,
    document.body
  );
}
