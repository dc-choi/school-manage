import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { label, error, options, placeholder, className = '', id, ...props },
    ref
) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                id={selectId}
                className={`
                    w-full rounded-md border px-3 py-2 text-sm
                    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
                    disabled:cursor-not-allowed disabled:bg-gray-100
                    ${className}
                `}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
});
