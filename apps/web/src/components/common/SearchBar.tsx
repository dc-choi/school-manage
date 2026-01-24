import { type ChangeEvent, type FormEvent, useState } from 'react';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    initialValue?: string;
}

export function SearchBar({ placeholder = '검색...', onSearch, initialValue = '' }: SearchBarProps) {
    const [query, setQuery] = useState(initialValue);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSearch(query.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md">
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                className="flex-1 rounded-l-md border border-r-0 border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="rounded-r-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                검색
            </button>
        </form>
    );
}
