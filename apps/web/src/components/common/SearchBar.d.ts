interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    initialValue?: string;
}
export declare function SearchBar({ placeholder, onSearch, initialValue }: SearchBarProps): import("react/jsx-runtime").JSX.Element;
export {};
