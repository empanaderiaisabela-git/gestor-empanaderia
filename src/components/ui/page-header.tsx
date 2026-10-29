interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className='flex justify-between items-center mb-6 shrink-0'>
      <div>
        <h1 className='text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight'>{title}</h1>
        {description && <p className='text-zinc-700 dark:text-zinc-200 mt-1'>{description}</p>}
      </div>
    </div>
  );
}
