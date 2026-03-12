import { Loader2, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

interface ChurchSelectProps {
    parishId: string;
    value: string | null;
    onChange: (churchId: string) => void;
}

export function ChurchSelect({ parishId, value, onChange }: ChurchSelectProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newChurchName, setNewChurchName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 300ms 디바운스
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading, error } = trpc.church.search.useQuery(
        { parishId, query: debouncedQuery || undefined },
        { keepPreviousData: true }
    );

    const createMutation = trpc.church.create.useMutation({
        onSuccess: (result) => {
            setDialogOpen(false);
            setNewChurchName('');
            setCreateError(null);
            onChange(result.id);
        },
        onError: (err) => {
            setCreateError(extractErrorMessage(err));
        },
    });

    const handleCreate = () => {
        if (!newChurchName.trim()) return;
        setCreateError(null);
        createMutation.mutate({ parishId, name: newChurchName.trim() });
    };

    const churches = data?.churches ?? [];

    return (
        <div className="space-y-4">
            {/* 검색 */}
            <div className="space-y-2">
                <Label htmlFor="church-search">본당 검색</Label>
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        ref={searchInputRef}
                        id="church-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="본당 이름을 검색하세요…"
                        className="pl-9"
                        spellCheck={false}
                        aria-label="본당 이름 검색"
                    />
                </div>
            </div>

            {/* 검색 결과 */}
            <div className="max-h-[280px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" aria-label="본당 검색 중" />
                    </div>
                ) : error ? (
                    <div className="text-center p-8 text-destructive">본당 목록을 불러오지 못했습니다.</div>
                ) : churches.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        {debouncedQuery ? `"${debouncedQuery}" 검색 결과가 없습니다.` : '등록된 본당이 없습니다.'}
                    </div>
                ) : (
                    <ul className="space-y-1" role="listbox" aria-label="본당 검색 결과">
                        {churches.map((church) => (
                            <li key={church.id} role="option" aria-selected={value === church.id}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition-colors hover:bg-accent ${
                                        value === church.id ? 'bg-accent' : ''
                                    }`}
                                    onClick={() => onChange(church.id)}
                                >
                                    <span className="font-medium">{church.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {church.organizationCount}개 단체
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 새로 만들기 */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                    setDialogOpen(true);
                    setCreateError(null);
                    setNewChurchName('');
                }}
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                새로 만들기
            </Button>

            {/* 본당 생성 다이얼로그 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>본당 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {createError && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {createError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="new-church-name">본당 이름</Label>
                            <Input
                                id="new-church-name"
                                type="text"
                                value={newChurchName}
                                onChange={(e) => setNewChurchName(e.target.value)}
                                placeholder="본당 이름을 입력하세요…"
                                spellCheck={false}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={createMutation.isPending}
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={!newChurchName.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    생성 중...
                                </>
                            ) : (
                                '추가'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
