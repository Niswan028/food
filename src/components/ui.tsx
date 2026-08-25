import { ReactNode } from 'react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-earth-200 border-t-primary-600 ${sizes[size]}`} />
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium text-earth-600">{message}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="skeleton h-40 w-full rounded-xl" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-earth-200 bg-white/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-earth-100 text-earth-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-earth-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-earth-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
}) {
  const variants = {
    default: 'bg-earth-100 text-earth-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700',
    info: 'bg-blue-100 text-blue-700',
    primary: 'bg-primary-100 text-primary-700',
  };
  return <span className={`badge ${variants[variant]}`}>{children}</span>;
}
