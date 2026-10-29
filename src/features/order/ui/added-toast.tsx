'use client';

import { CheckCircle2 } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TOAST_MS = 3000;

type Added = { name: string; id: number };

export function useAddedToast(): { added: Added | null; notify: (name: string) => void } {
  const [added, setAdded] = useState<Added | null>(null);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [added]);
  return { added, notify: (name) => setAdded((previous) => ({ name, id: (previous?.id ?? 0) + 1 })) };
}

export function AddedToast({ added }: { added: Added | null }): JSX.Element | null {
  if (!added) return null;
  return createPortal(
    <p key={added.id} role='status' className='pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-xl animate-toast-drop'>
      <CheckCircle2 className='w-5 h-5 shrink-0' />
      {`Se agregó ${added.name} al pedido`}
    </p>,
    document.body
  );
}
