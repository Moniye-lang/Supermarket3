"use client";

import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, ...props }, ref) => {
    return (
        <div className="relative w-full">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm",
                    icon ? "pl-10" : "",
                    className
                )}
                ref={ref}
                {...props}
            />
        </div>
    );
});
Input.displayName = 'Input';

export { Input };
