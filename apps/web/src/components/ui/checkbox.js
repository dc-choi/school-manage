import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '~/lib/utils';
const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
    return (_jsx("input", { type: "checkbox", ref: ref, checked: checked, onChange: (e) => onCheckedChange?.(e.target.checked), className: cn('h-8 w-8 cursor-pointer rounded border border-primary accent-primary', 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', 'disabled:cursor-not-allowed disabled:opacity-50', className), ...props }));
});
Checkbox.displayName = 'Checkbox';
export { Checkbox };
