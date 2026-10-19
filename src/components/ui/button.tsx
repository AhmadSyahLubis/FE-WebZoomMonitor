import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        outline: 'border border-slate-400 bg-white shadow-sm hover:bg-slate-50 text-slate-800 hover:border-slate-500',
        secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200',
        ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
        link: 'text-blue-600 underline-offset-4 hover:underline p-0 h-auto',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
      },
      size: {
        default: 'min-h-11 px-4 py-2 rounded-[14px]',
        sm: 'min-h-11 rounded-xl px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
