import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export function BrandIcon({ name, className }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={cn('brand-icon', className)} style={{ '--icon-url': `url(/icons/${name}.svg)` } as CSSProperties} />;
}
