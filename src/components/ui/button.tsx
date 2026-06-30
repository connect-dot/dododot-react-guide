import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	'crg-inline-flex crg-items-center crg-justify-center crg-whitespace-nowrap crg-rounded-md crg-text-sm crg-font-medium crg-transition-colors crg-cursor-pointer crg-border-0 disabled:crg-pointer-events-none disabled:crg-opacity-50',
	{
		variants: {
			variant: {
				primary:
					'crg-bg-brand crg-text-brand-foreground hover:crg-bg-brand/90',
				secondary:
					'crg-bg-muted crg-text-muted-foreground hover:crg-bg-muted/80',
				ghost:
					'crg-bg-transparent crg-text-icon hover:crg-text-foreground crg-p-1 crg-leading-none',
			},
			size: {
				default: 'crg-h-9 crg-px-4 crg-py-2',
				icon: 'crg-h-7 crg-w-7 crg-text-lg',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'default',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button, buttonVariants };
