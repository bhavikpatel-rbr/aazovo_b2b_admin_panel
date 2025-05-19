// src/components/ui/Textarea.tsx (or wherever your Textarea component is)
import React, { ForwardedRef } from 'react';
import classNames from 'classnames'; // Optional: for conditional classes

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    prefix?: React.ReactNode;
    // You can add other custom props like 'suffix', 'inputClassName', 'prefixClassName' if needed
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (props, ref: ForwardedRef<HTMLTextAreaElement>) => {
        const { className, prefix, ...rest } = props;

        // Base styles for the textarea (adapt from your Input component or design system)
        // This example assumes Tailwind-like classes.
        const baseTextareaStyles =
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-500 dark:focus:border-indigo-500';

        // Adjust padding if prefix exists
        const textareaPadding = prefix ? 'pl-10 pr-3' : 'px-3'; // Increase left padding for prefix

        return (
            <div className="relative w-full">
                {prefix && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* Ensure prefix icon has appropriate styling (e.g., text color) */}
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                            {prefix}
                        </span>
                    </div>
                )}
                <textarea
                    ref={ref}
                    className={classNames(
                        baseTextareaStyles,
                        textareaPadding, // Apply conditional padding
                        className // Allow overriding or extending classes
                    )}
                    {...rest} // Spreads `value`, `onChange`, `onBlur`, `name` from RHF `field` + other HTML attributes
                />
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
export default Textarea;