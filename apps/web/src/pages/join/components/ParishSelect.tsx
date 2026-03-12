import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { trpc } from '~/lib/trpc';

interface ParishSelectProps {
    value: string | null;
    onChange: (parishId: string) => void;
}

export function ParishSelect({ value, onChange }: ParishSelectProps) {
    const [query, setQuery] = useState('');
    const { data, isLoading, error } = trpc.parish.list.useQuery();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" aria-label="교구 목록 불러오는 중" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-8 text-destructive">교구 목록을 불러오지 못했습니다.</div>;
    }

    const allParishes = data?.parishes ?? [];
    const filtered = query.trim() ? allParishes.filter((p) => p.name.includes(query.trim())) : allParishes;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="parish-search">교구 검색</Label>
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="parish-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="교구 이름을 검색하세요…"
                        className="pl-9"
                        spellCheck={false}
                        aria-label="교구 이름 검색"
                    />
                </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        {query ? `"${query}" 검색 결과가 없습니다.` : '등록된 교구가 없습니다.'}
                    </div>
                ) : (
                    <ul className="space-y-1" role="listbox" aria-label="교구 검색 결과">
                        {filtered.map((parish) => (
                            <li key={parish.id} role="option" aria-selected={value === parish.id}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center rounded-md px-3 py-3 text-left font-medium transition-colors hover:bg-accent ${
                                        value === parish.id ? 'bg-accent' : ''
                                    }`}
                                    onClick={() => onChange(parish.id)}
                                >
                                    {parish.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
