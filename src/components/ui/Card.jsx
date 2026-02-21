import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({ className, children, hoverEffect = false, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            whileHover={hoverEffect ? { y: -5 } : {}}
            className={cn(
                "glass rounded-xl overflow-hidden transition-all duration-300",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("p-6 pb-2", className)}
        {...props}
    />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-display text-2xl font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-2", className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardContent };
